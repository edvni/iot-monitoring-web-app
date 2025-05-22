import { useEffect, useState, useCallback } from "react";
import { LineChart } from '@mui/x-charts/LineChart';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { TextField } from "@mui/material";
import { DateField } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/en-gb';
import db from "../backend/firebase";
import {
  collection,
  query,
  getDocs,
  where,
} from "firebase/firestore";
import { SensorData, DailyMeasurement } from "../types/SensorData";
import ExportTagButton from "./ExportTagButton";
import ExportAllButton from "./ExportAllButton";
import StatisticsPanel from "./StatisticsPanel";
import { calculateStatistics, emptyStatistics, Statistics } from "../utils/SensorStatistics";

// Extend dayjs with the UTC plugin
dayjs.extend(utc);

export default function BasicLineChart() {

  // TODO: check which one is strictly needed for LineChart

  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs('01/01/2025'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs('12/31/2025'));
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [debugMessage, setDebugMessage] = useState<string>("");
  const [showTemperature, setShowTemperature] = useState(true);
  const [showHumidity, setShowHumidity] = useState(true);
  const [showBatteryLevel, setShowBatteryLevel] = useState(false);
  const [showBatteryVoltage, setShowBatteryVoltage] = useState(false);
  const [statistics, setStatistics] = useState<Statistics>(emptyStatistics);
  const [calibratedDates, setCalibratedDates] = useState<boolean>();
  const [latestBattery, setLatestBattery] = useState<{level?: number, voltage?: number}>({});

  const getChartSettings = () => {
    const yAxis = [];

    if (showTemperature) {
      yAxis.push({
        id: 'temperature',
        label: 'Temperature (°C)',
        scaleType: 'linear' as const,
        position: 'left' as const,
      });
    }

    if (showHumidity) {
      yAxis.push({
        id: 'humidity',
        label: 'Humidity (%)',
        scaleType: 'linear' as const,
        position: 'right' as const,
      });
    }

    if (showBatteryLevel) {
      yAxis.push({
        id: 'batteryLevel',
        label: 'Battery Level (%)',
        scaleType: 'linear' as const,
        position: 'left' as const,
      });
    }

    if (showBatteryVoltage) {
      yAxis.push({
        id: 'batteryVoltage',
        label: 'Battery Voltage (mV)',
        scaleType: 'linear' as const,
        position: 'right' as const,
      });
    }

    return {
      margin: { left: 80 },
      yAxis,
    };
};

  // Function to fetch unique tag IDs
  const fetchTagIds = useCallback(async () => {
    try {
      const q = query(
        collection(db, "daily_measurements_Vladimir"),
      );
      
      const querySnapshot = await getDocs(q);
      const uniqueIds = new Set<string>();
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data() as DailyMeasurement;
        if (data.tag_id) {
          uniqueIds.add(data.tag_id);
        }
      });
      
      const uniqueTagIdsArray = Array.from(uniqueIds);
      setTagIds(uniqueTagIdsArray);
      
      if (uniqueTagIdsArray.length > 0 && !selectedTagId) {
        setSelectedTagId(uniqueTagIdsArray[0]);
      }

      setDebugMessage(`Found ${uniqueTagIdsArray.length} unique tag IDs`);
    } catch (error) {
      console.error("Error fetching tag IDs:", error);
      setDebugMessage(`Error fetching tag IDs: ${error}`);
    }
  }, [selectedTagId]);


  // Function to fetch data based on date range and selected tag
  const fetchData = useCallback(async () => {
    try {
      if (!selectedTagId) {
        setDebugMessage("No tag ID selected");
        return;
      }

      // Convert dayjs objects to strings for Firestore query
      const startDateStr = startDate?.format("YYYY-MM-DD") || '2025-01-01';
      const endDateStr = endDate?.format("YYYY-MM-DD") || '2025-12-31';

      setDebugMessage(`Fetching data for tag ID: ${selectedTagId} from ${startDateStr} to ${endDateStr}`);

      // Query for documents within date range and with matching tag_id
      const q = query(
        collection(db, "daily_measurements_Vladimir"),
        where("tag_id", "==", selectedTagId),
      );

      const querySnapshot = await getDocs(q);
      setDebugMessage(`Found ${querySnapshot.size} documents for tag ID: ${selectedTagId}`);

      // Process the new data format
      const newData: SensorData[] = [];
      let latestBatteryData: { level?: number; voltage?: number } = { level: undefined, voltage: undefined };

      querySnapshot.docs.forEach(doc => {
        const dailyData = doc.data() as DailyMeasurement;

        if (dailyData.battery_level || dailyData.battery_voltage) {
          latestBatteryData = {
            level: dailyData.battery_level ? parseInt(dailyData.battery_level) : undefined,
            voltage: dailyData.battery_voltage ? parseInt(dailyData.battery_voltage) : undefined,
          };
        }

        // Filter by date range
        if (dailyData.day >= startDateStr && dailyData.day <= endDateStr) {
          console.log(`Processing document for day ${dailyData.day} with ${dailyData.measurements?.length || 0} measurements`);

          // For each measurement in the array, convert to SensorData
          if (Array.isArray(dailyData.measurements)) {
            dailyData.measurements.forEach(measurement => {
              if (!measurement.ts || !measurement.t || !measurement.h) {
                console.warn("Invalid measurement format:", measurement);
                return;
              }
              
              const timestamp = dayjs(measurement.ts);
              
              if (timestamp.isValid()) {

                // Check if the timestsamp falls within the selected range
                const measurementDate = timestamp.format("YYYY-MM-DD");
                if (measurementDate >= startDateStr && measurementDate <= endDateStr) {
                  const sensorDataPoint: SensorData = {
                    tag_id: dailyData.tag_id,
                    timestamp: {
                      seconds: timestamp.unix(),
                      nanoseconds: 0,
                    },
                    temperature: parseFloat(measurement.t),
                    humidity: parseFloat(measurement.h),
                  };

                  // Add battery data to each data point if available
                  if (latestBatteryData.level !== undefined) {
                    sensorDataPoint.battery_level = latestBatteryData.level;
                  }
                  if (latestBatteryData.voltage !== undefined) {
                    sensorDataPoint.battery_voltage = latestBatteryData.voltage;
                  }

                  newData.push(sensorDataPoint);
                }
              } else {
                console.warn("Invalid timestamp format:", measurement.ts);
              }
            });
          }
        }
      });

      // Sort by timestamp
      newData.sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);
      setDebugMessage(`Processed ${newData.length} data points`);

      if (newData.length > 0) {
        console.log("First measurement time (source):", newData[0].timestamp.seconds);
        console.log("First measurement formatted:", dayjs.unix(newData[0].timestamp.seconds).format('YYYY-MM-DD HH:mm:ss'));
        console.log("First measurement UTC:", dayjs.unix(newData[0].timestamp.seconds).utc().format('YYYY-MM-DD HH:mm:ss'));
        console.log("First measurement Local:", dayjs.unix(newData[0].timestamp.seconds).local().format('YYYY-MM-DD HH:mm:ss'));
      }

      // Store latest battery information to for display
      setLatestBattery(latestBatteryData);
      // Update state with new data
      setSensorData(newData);
      // Calculate statistics
      const calculatedStats = calculateStatistics(newData);
      setStatistics(calculatedStats);

    } catch (error) {
      console.error("Error fetching data:", error);
      setDebugMessage(`Error fetching data: ${error}`);
    }
  }, [selectedTagId, startDate, endDate]);

  // Fetch tag IDs on mount
  useEffect(() => {
    fetchTagIds();

  }, [fetchTagIds]);

  // Fetch data when tag ID or date range changes
  useEffect(() => {
    if (selectedTagId) {
      fetchData();
    }
  }, [fetchData, selectedTagId, startDate, endDate]);

  const formatTimestamp = (timestamp: {
      seconds: number;
      nanoseconds: number;
    }) => {
      const date = new Date(timestamp.seconds * 1000);
      return (
        new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "numeric",
          year: "numeric",
        }).format(date) +
        " " +
        date.toLocaleTimeString("en-GB", { hour12: false })
      );
    };

  const mappedData = sensorData.map((data) => ({
    tag_id: data.tag_id,
    timestamp: data.timestamp.seconds * 1000,
    temperature: data.temperature,
    humidity: data.humidity,
    battery_level: data.battery_level,
    battery_voltage: data.battery_voltage,
  }));

  useEffect(() => {
    if (mappedData.length > 0 && !calibratedDates) {
      const mappedById = mappedData.filter(data => data.tag_id === selectedTagId);
      setStartDate(dayjs(mappedById.map(data => data.timestamp).reduce((a, b) => Math.min(a, b))));
      setEndDate(dayjs(mappedById.map(data => data.timestamp).reduce((a, b) => Math.max(a, b))));
      setCalibratedDates(true);
    }
  }, [mappedData]);


  const series = [
    ...(showTemperature ? [{
      dataKey: 'temperature',
      label: 'Temperature (°C)',
      valueFormatter: (value: any) => `Temperature: ${value} °C`,
      connectNulls: true,
      color: '#FF5722',
      yAxisKey: 'temperature',
    }] : []),
    ...(showHumidity ? [{
      dataKey: 'humidity',
      label: 'Humidity',
      valueFormatter: (value: any) => `Humidity: ${value} %`,
      connectNulls: true,
      color: '#2196F3',
      yAxisKey: 'humidity',
    }] : []),
    ...(showBatteryLevel ? [{
      dataKey: 'battery_level',
      label: 'Battery Level',
      valueFormatter: (value: any) => `Battery Level: ${value} %`,
      connectNulls: true,
      color: '#4CAF50',
      yAxisKey: 'batteryLevel',
    }] : []),
    ...(showBatteryVoltage ? [{
      dataKey: 'battery_voltage',
      label: 'Battery Voltage',
      valueFormatter: (value: any) => `Battery Voltage: ${value} mV`,
      connectNulls: true,
      color: '#9C27B0',
      yAxisKey: 'batteryVoltage',
    }] : []),
  ];

  // Battery status display component
  const BatteryStatus = () => {
    if (!latestBattery.level && !latestBattery.voltage) return null;
    
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        padding: "8px 12px", 
        background: "#f5f5f5", 
        borderRadius: "4px", 
        marginBottom: "12px",
        marginTop: "8px",
        border: "1px solid #e0e0e0"
      }}>
        <span style={{ fontWeight: "bold", marginRight: "8px" }}>Latest Battery Status:</span>
        {latestBattery.level !== undefined && (
          <span style={{ 
            marginRight: "16px", 
            color: latestBattery.level > 50 ? "#4CAF50" : latestBattery.level > 20 ? "#FF9800" : "#F44336"
          }}>
            Level: {latestBattery.level}%
          </span>
        )}
        {latestBattery.voltage !== undefined && (
          <span>Voltage: {latestBattery.voltage} mV</span>
        )}
      </div>
    );
  };

  return (
    <Stack spacing={2} sx={{ width: '100%', maxWidth: '1200px' }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: '100%', maxWidth: '1200px' }}>
        <TextField // select which sensor's data to show
          select
          label="Sensor ID"
          value={selectedTagId || ""}
          onChange={(e) => setSelectedTagId(e.target.value)}
          sx={{ marginBottom: 2, height: 40, minWidth: 200 }}>
            {tagIds.map((tagId) => (
              <MenuItem key={tagId} value={tagId}>
                {tagId}
              </MenuItem>
            ))}
        </TextField>

        <FormGroup row>
          <FormControlLabel
            control={
              <Checkbox 
                checked={showTemperature}
                onChange={() => setShowTemperature(!showTemperature)}
                color="primary"
              />
            }
            label="Temperature"
          />
          <FormControlLabel
            control={
              <Checkbox 
                checked={showHumidity}
                onChange={() => setShowHumidity(!showHumidity)}
                color="primary"
              />
            }
            label="Humidity"
          />
          <FormControlLabel
            control={
              <Checkbox 
                checked={showBatteryLevel}
                onChange={() => setShowBatteryLevel(!showBatteryLevel)}
                color="success"
              />
            }
            label="Battery Level"
          />
          <FormControlLabel
            control={
              <Checkbox 
                checked={showBatteryVoltage}
                onChange={() => setShowBatteryVoltage(!showBatteryVoltage)}
                color="secondary"
              />
            }
            label="Battery Voltage"
          />
        </FormGroup>

        <div>
          <ExportTagButton 
            selectedTagId={selectedTagId || ""} 
            tagData={mappedData}
            formatTimestamp={formatTimestamp}
          />
        </div>
        <div>
          <ExportAllButton 
          />
        </div>
      </div>

      <Stack spacing={2} direction="row" sx={{ width: 250 }}> 
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-GB">
          <DateField
            label="Start Date"
            defaultValue={startDate}
            value={startDate}
            onChange={(newValue) => setStartDate(newValue)}
            size="small"
            format="DD/MM/YYYY"
          />
          <DateField
            label="End Date"
            defaultValue={endDate}
            value={endDate}
            onChange={(newValue) => setEndDate(newValue)}
            size="small"
            margin="normal"
            format="DD/MM/YYYY"
          />
        </LocalizationProvider>
      </Stack>

      <BatteryStatus />

      {mappedData.length > 0 ? (
        <>
          <LineChart
            height={500}
            width={undefined} 
            dataset={mappedData}
            xAxis={[
              { 
                dataKey: 'timestamp',
                scaleType: 'time',
                valueFormatter: (value) => {
                  const date = new Date(value);
                  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} - ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                },
                tickLabelStyle: { fontSize: 12 },
                min: sensorData.length > 0 ? sensorData[0].timestamp.seconds * 1000 : undefined,
                max: sensorData.length > 0 ? sensorData[sensorData.length-1].timestamp.seconds * 1000 : undefined,
                tickNumber: 8,
              }
            ]}
            series={series}
            {...getChartSettings()}
            sx={{
              [`& .${axisClasses.left} .${axisClasses.label}`]: {
                transform: showTemperature ? 'translateX(-20px)' : 'translateX(0)',
              },
              [`& .${axisClasses.right} .${axisClasses.label}`]: {
                transform: (showHumidity || showBatteryLevel || showBatteryVoltage) ? 'translateX(20px)' : 'translateX(0)',
              },
            }}
            slotProps={{
              legend: {
                direction: 'row',
                position: {
                  vertical: 'top',
                  horizontal: 'middle',
                },
              },
            }}
          />

          {/* Debug information */}
          {debugMessage && (
            <div style={{ background: "#f0f0f0", padding: "0.5rem", marginBottom: "0.5rem", fontSize: "12px", color: "#555", maxWidth: "200px" }}>
              Debug: {debugMessage}<br />
              Data points: {mappedData.length}
            </div>
          )}

          {/* Statistics Panel */}
          <StatisticsPanel 
            statistics={statistics} 
            selectedTagId={selectedTagId}
            showTemperature={showTemperature}
            showHumidity={showHumidity}
            showBatteryLevel={showBatteryLevel}
            showBatteryVoltage={showBatteryVoltage}
            batteryInfo={latestBattery}
          />
        </>
      ) : (
        <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #ccc" }}>
          No data available for the selected date range and tag
        </div>
      )}
    </Stack>
  );
}