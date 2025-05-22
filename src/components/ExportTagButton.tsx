// src/components/ExportTagButton.tsx
import { useState } from "react";
import { exportToCsv } from "../utils/exportToCsv";
import '../styles/ExportButton.css';

interface ExportTagButtonProps {
  // For LineChart: export specific tag data
  selectedTagId?: string;
  tagData?: any[];
  // Optional formatter for timestamps
  formatTimestamp: (timestamp: { seconds: number; nanoseconds: number }) => string;
  className?: string;
}

const ExportTagButton: React.FC<ExportTagButtonProps> = ({ 
  selectedTagId, 
  tagData,
  formatTimestamp,
  className
}) => {
  const [isExporting, setIsExporting] = useState(false);

  // Function to handle CSV export of selected tag data
  const handleExportSelectedData = () => {
    if (!tagData || tagData.length === 0) return;

    setIsExporting(true);
    
    try {
      const exportData = tagData.map(data => {
        return {
          timestamp: formatTimestamp({ seconds: data.timestamp / 1000, nanoseconds: 0 }),
          temperature: data.temperature,
          humidity: data.humidity,
          tag_id: data.tag_id,
          battery_level: data.battery_level || 'N/A',
          battery_voltage: data.battery_voltage || 'N/A'
        };
      });

      exportToCsv(`sensor-data-${selectedTagId || 'unknown'}.csv`, exportData);
    } catch (error) {
      console.error("Error exporting tag data:", error);
      alert("Error exporting data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      className={`export-button ${className || ''}`}
      onClick={handleExportSelectedData}
      disabled={!tagData || tagData.length === 0 || isExporting}
    >
      {isExporting ? 'Exporting...' : 'Export tag data'}
    </button>
  );
};

export default ExportTagButton;