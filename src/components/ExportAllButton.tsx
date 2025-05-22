// src/components/ExportAllButton.tsx
import { useState } from "react";
import db from "../backend/firebase";
import { collection, query, getDocs } from "firebase/firestore";
import { exportToCsv } from "../utils/exportToCsv";
import '../styles/ExportButton.css';

interface ExportAllButtonProps {
  className?: string;
}

const ExportAllButton: React.FC<ExportAllButtonProps> = ({ className }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const formatTimestamp = (dateString: string, timeString: string): string => {
    // Parse the date (assuming format is YYYY-MM-DD from Firestore)
    const [year, month, day] = dateString.split('-');
    // Return in DD/MM/YYYY HH:MM:SS format
    return `${day}/${month}/${year} ${timeString}`;
  };

  // Function to open confirmation dialog
  const handleButtonClick = () => {
    setShowConfirmDialog(true);
  };

  const handleCancelExport = () => {
    setShowConfirmDialog(false);
  };

  // Function to fetch and export ALL data
  const handleExportAllData = async () => {
    setShowConfirmDialog(false);
    setIsExporting(true);

    try {
      // Query without limit to get all data
      const q = query(collection(db, "daily_measurements_Vladimir"));  
      const querySnapshot = await getDocs(q);
      
      const exportData = querySnapshot.docs.flatMap(doc => {
        const data = doc.data();
        const tagId = data.tag_id || 'unknown';
        const day = data.day || 'unknown';
        const measurements = data.measurements || [];

        return measurements.map((m: { h: string; t: string; ts: string }) => ({
          timestamp: formatTimestamp(day, m.ts),
          temperature: parseFloat(m.t),
          humidity: parseFloat(m.h),
          tag_id: tagId,
          battery_level: data.battery_level || 'N/A',
          battery_voltage: data.battery_voltage || 'N/A'
        }));
      });
      
      exportToCsv('all-sensor-data.csv', exportData);
    } catch (error) {
      console.error("Error exporting all data:", error);
      alert("Error exporting data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

   // Render confirmation dialog when active
  if (showConfirmDialog) {
    return (
      <div className="export-dialog-overlay">
        <div className="export-dialog">
          <h3>WARNING!</h3>
          <p>Exporting all sensor data will execute a query that might exceed the daily free tier limits in Firestore.</p>
          <p>This could potentially incur charges to your Google Cloud account if you have billing enabled.</p>
          <a href="https://firebase.google.com/docs/firestore/quotas">Learn more about Firestore daily limits</a>
          <p>Are you sure you want to proceed?</p>
          <div className="export-dialog-buttons">
            <button onClick={handleCancelExport}>Cancel</button>
            <button 
              onClick={handleExportAllData}
              className="export-danger-button"
            >
              Yes, export all data
            </button>
          </div>
        </div>
      </div>
    );
  }

 /*  // Render the button or dialog as needed
  if (showConfirmDialog) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: '#242424',
          padding: '20px',
          borderRadius: '5px',
          maxWidth: '500px',
          width: '90%'
        }}>
          <h3>WARNING!</h3>
          <p>Exporting all sensor data will execute a query that might exceed the daily free tier limits in Firestore.</p>
          <p>This could potentially incur charges to your Google Cloud account if you have billing enabled.</p>
          <a href="https://firebase.google.com/docs/firestore/quotas">Learn more about Firestore daily limits</a>
          <p>Are you sure you want to proceed?</p>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '20px',
            gap: '10px'
          }}>
            <button onClick={() => setShowConfirmDialog(false)}>Cancel</button>
            <button 
              onClick={handleExportAllData}
              style={{
                backgroundColor: '#b61515',
                color: 'white',
                padding: '8px 16px',
              }}
            >
              Yes, export all data
            </button>
          </div>
        </div>
      </div>
    );
  } */

  return (
    <button
      className={`export-button ${className || ''}`} 
      onClick={handleButtonClick} 
      disabled={isExporting}
    >
      {isExporting ? 'Exporting...' : 'Export all data'}
    </button>
  );
};

export default ExportAllButton;