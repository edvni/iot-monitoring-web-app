import { useEffect, useState, useCallback } from "react";
import db from "../backend/firebase";
import { SensorData, DailyMeasurement, convertToSensorData } from "../types/SensorData";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  DocumentSnapshot,
} from "firebase/firestore";

/**
 * Component for displaying paginated sensor data from Firestore
 * 
 * Features:
 * - Fetches sensor data in pages
 * - Converts raw measurements to standardized format
 * - Supports infinite scrolling with "Load More" functionality
 * - Formats timestamps for display
 * 
 * @returns {JSX.Element} A React component that renders sensor data
 */
const SensorDataComponent: React.FC = () => {
  // State for storing processed sensor data
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  // Reference to the last document for pagination
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  // Flag indicating whether more data is available
  const [hasMore, setHasMore] = useState(true);
  // Number of daily measurement documents to fetch per page
  const pageSize = 5;

  /**
   * Fetches sensor data from Firestore with pagination support
   * @param {boolean} loadMore - Whether to append to existing data
   * @param {DocumentSnapshot | null} startAfterDoc - Document to start after for pagination
   */
  const fetchData = useCallback(
    async (loadMore = false, startAfterDoc: DocumentSnapshot | null = null) => {
      try {
        // Base query for daily measurements, ordered by day (newest first)
        let q = query(
          collection(db, "daily_measurements_Vladimir"),
          orderBy("day", "desc"),
          limit(pageSize)
        );

        // Modify query for pagination if loading more data
        if (loadMore && startAfterDoc) {
          q = query(
            collection(db, "daily_measurements_Vladimir"),
            orderBy("day", "desc"),
            startAfter(startAfterDoc),
            limit(pageSize)
          );
        }

        const querySnapshot = await getDocs(q);
        
        // Process the raw Firestore data into SensorData format
        const newData: SensorData[] = [];
        querySnapshot.docs.forEach(doc => {
          const dailyData = doc.data() as DailyMeasurement;

          // Process the last 5 measurements (or fewer if less available)
          const measurementCount = Math.min(5, dailyData.measurements.length);
          for (let i = dailyData.measurements.length - 1; i >= dailyData.measurements.length - measurementCount; i--) {
            if (i >= 0) {
              const sensorData = convertToSensorData(dailyData, i);
              newData.push(sensorData);
            }
          }
        });
        
        // Update pagination state
        if (!querySnapshot.empty) {
          setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
        }

        // Either replace or append data based on loadMore flag
        setSensorData(prev => (loadMore ? [...prev, ...newData] : newData));

        // Determine if more data is available
        setHasMore(querySnapshot.docs.length === pageSize);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    },
    []
  );

  // Initial data fetch on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Formats a Firestore timestamp into a human-readable string
   * @param {Object} timestamp - Firestore timestamp object
   * @param {number} timestamp.seconds - Unix timestamp in seconds
   * @param {number} timestamp.nanoseconds - Nanoseconds component
   * @returns {string} Formatted date string (e.g., "May 15, 2023 - 14:30:00")
   */
  const formatTimestamp = (timestamp: {
    seconds: number;
    nanoseconds: number;
  }) => {
    const date = new Date(timestamp.seconds * 1000);
    return (
      new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
      }).format(date) +
      " - " +
      date.toLocaleTimeString("en-US", { hour12: false })
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Sensor Data</h2>
      </div>
      <hr />

      {/* Render sensor data list */}
      {sensorData.map((data, index) => (
        <div key={index}>
          <p>{formatTimestamp(data.timestamp)}</p>
          <p>Temperature: {data.temperature}°C</p>
          <p>Humidity: {data.humidity}%</p>
          <hr />
        </div>
      ))}

      {/* Load More button (only shown when more data is available) */}
      {hasMore && <button onClick={() => fetchData(true, lastDoc)}>Load More</button>}

    </div>
  );
};

export default SensorDataComponent;
