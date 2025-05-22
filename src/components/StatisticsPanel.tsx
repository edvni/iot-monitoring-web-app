import React from 'react';
import { Paper, Typography, Grid, Box } from "@mui/material";
import { Statistics } from "../utils/SensorStatistics";

interface StatisticsPanelProps {
  statistics: Statistics;
  selectedTagId: string | null;
  showTemperature: boolean;
  showHumidity: boolean;
  showBatteryLevel?: boolean;
  showBatteryVoltage?: boolean;
  batteryInfo?: {
    level?: number;
    voltage?: number;
  };
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  statistics,
  selectedTagId,
  showTemperature,
  showHumidity,
  showBatteryLevel,
  showBatteryVoltage,
  batteryInfo
}) => {
  if (!selectedTagId) return null; // Don't render anything if no tag is selected
  
  return (
    <Paper elevation={3} sx={{ p: 2, mt: 2, backgroundColor: '#f8f9fa' }}>
      <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #e0e0e0', pb: 1 }}>
        Statistics for Sensor {selectedTagId}
      </Typography>
      
      <Grid container spacing={3}>
        {showTemperature && (
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, backgroundColor: '#fff3e0', borderRadius: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#e65100">Temperature</Typography>
              <StatItem label="Min" value={`${statistics.temperature.min.toFixed(2)} °C`} />
              <StatItem label="Max" value={`${statistics.temperature.max.toFixed(2)} °C`} />
              <StatItem label="Average" value={`${statistics.temperature.avg.toFixed(2)} °C`} />
              <StatItem label="Latest" value={`${statistics.temperature.latest.toFixed(2)} °C`} />
            </Box>
          </Grid>
        )}
        
        {showHumidity && (
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, backgroundColor: '#e1f5fe', borderRadius: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#0277bd">Humidity</Typography>
              <StatItem label="Min" value={`${statistics.humidity.min.toFixed(2)} %`} />
              <StatItem label="Max" value={`${statistics.humidity.max.toFixed(2)} %`} />
              <StatItem label="Average" value={`${statistics.humidity.avg.toFixed(2)} %`} />
              <StatItem label="Latest" value={`${statistics.humidity.latest.toFixed(2)} %`} />
            </Box>
          </Grid>
        )}

        {showBatteryLevel && batteryInfo?.level !== undefined && (
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, backgroundColor: '#e8f5e9', borderRadius: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#2e7d32">Battery Level</Typography>
              <StatItem label="Latest" value={`${batteryInfo.level} %`} />
              <BatteryLevelIndicator level={batteryInfo.level} />
            </Box>
          </Grid>
        )}

        {showBatteryVoltage && batteryInfo?.voltage !== undefined && (
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, backgroundColor: '#f3e5f5', borderRadius: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#7b1fa2">Battery Voltage</Typography>
              <StatItem label="Latest" value={`${batteryInfo.voltage} mV`} />
              <BatteryHealthIndicator voltage={batteryInfo.voltage} />
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

// Battery voltage health indicator
const BatteryHealthIndicator: React.FC<{ voltage: number }> = ({ voltage }) => {
  // Define voltage thresholds for Li-ion/LiPo batteries
  // Below 3.3V is considered low, 3.3-3.7V is medium, above 3.7V is good
  const lowThreshold = 3300;
  const mediumThreshold = 3700;
  
  let color = '#4caf50'; // Green
  let message = 'Good';
  let healthPercentage = 100;
  
  if (voltage < lowThreshold) {
    color = '#f44336'; // Red
    message = 'Low';
    healthPercentage = Math.max(0, (voltage / lowThreshold) * 50);
  } else if (voltage < mediumThreshold) {
    color = '#ff9800'; // Orange
    message = 'Medium';
    healthPercentage = 50 + ((voltage - lowThreshold) / (mediumThreshold - lowThreshold)) * 30;
  } else {
    healthPercentage = 80 + Math.min(20, ((voltage - mediumThreshold) / 500) * 20);
  }
  
  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ 
        height: '12px', 
        width: '100%', 
        backgroundColor: '#e0e0e0', 
        borderRadius: '6px',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          height: '100%', 
          width: `${healthPercentage}%`, 
          backgroundColor: color, 
          transition: 'width 0.5s ease-in-out'
        }} />
      </Box>
      <Typography variant="caption" sx={{ color, mt: 0.5 }}>
        {message} ({voltage}mV)
      </Typography>
    </Box>
  );
};

// Helper component for displaying individual statistics
const StatItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 0.5 }}>
    <Typography variant="body2" color="text.secondary">{label}:</Typography>
    <Typography variant="body2" fontWeight="medium">{value}</Typography>
  </Box>
);

// Battery level visual indicator
const BatteryLevelIndicator: React.FC<{ level: number }> = ({ level }) => {
  let color = '#4caf50'; // Green
  let message = 'Good';
  
  if (level < 30) {
    color = '#f44336'; // Red
    message = 'Low';
  } else if (level < 50) {
    color = '#ff9800'; // Orange
    message = 'Medium';
  }
  
  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ 
        height: '12px', 
        width: '100%', 
        backgroundColor: '#e0e0e0', 
        borderRadius: '6px',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          height: '100%', 
          width: `${level}%`, 
          backgroundColor: color, 
          transition: 'width 0.5s ease-in-out'
        }} />
      </Box>
      <Typography variant="caption" sx={{ color, mt: 0.5 }}>
        {message} ({level}%)
      </Typography>
    </Box>
  );
};

export default StatisticsPanel;
