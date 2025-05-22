import { SensorData } from "../types/SensorData";

interface StatisticValue {
  min: number;
  max: number;
  avg: number;
  latest: number;
}

// Interface for statistics
export interface Statistics {
  temperature: StatisticValue;
  humidity: StatisticValue;
  battery_level?: StatisticValue;
  battery_voltage?: StatisticValue;
  timestamp: {
    first: number;
    last: number;
  };
}

// Initialize empty statistics object
export const emptyStatistics: Statistics = {
  temperature: { min: 0, max: 0, avg: 0, latest: 0 },
  humidity: { min: 0, max: 0, avg: 0, latest: 0 },
  timestamp: { first: 0, last: 0 }
};

/**
 * Calculate statistics from sensor data
 * @param data Array of sensor data points
 * @returns Statistics object with min, max, avg values
 */
export const calculateStatistics = (data: SensorData[]): Statistics => {
  if (!data || data.length === 0) {
    return emptyStatistics;
  }

  // Initialize with first values
  const temperatureValues = data.map(d => d.temperature);
  const humidityValues = data.map(d => d.humidity);
  const timestamps = data.map(d => d.timestamp.seconds);

  // check if any data points have battery information
  const hasBatteryLevel = data.some(d => d.battery_level !== undefined);
  const hasBatteryVoltage = data.some(d => d.battery_voltage !== undefined);

  // Extract battery data if available (filter out undefined values)
  // Extract battery data if available (filter out undefined values)
  const batteryLevelValues = hasBatteryLevel 
    ? data.filter(d => d.battery_level !== undefined).map(d => Number(d.battery_level))
    : [];
    
  const batteryVoltageValues = hasBatteryVoltage
    ? data.filter(d => d.battery_voltage !== undefined).map(d => Number(d.battery_voltage))
    : [];

  // Calculate statistics
  const stats: Statistics = {
    temperature: {
      min: Math.min(...temperatureValues),
      max: Math.max(...temperatureValues),
      avg: temperatureValues.reduce((sum, val) => sum + val, 0) / temperatureValues.length,
      latest: temperatureValues[temperatureValues.length - 1]
    },
    humidity: {
      min: Math.min(...humidityValues),
      max: Math.max(...humidityValues),
      avg: humidityValues.reduce((sum, val) => sum + val, 0) / humidityValues.length,
      latest: humidityValues[humidityValues.length - 1]
    },
    timestamp: {
      first: Math.min(...timestamps),
      last: Math.max(...timestamps)
    }
  };

  // Add battery statistics if available
  if (hasBatteryLevel && batteryLevelValues.length > 0) {
    stats.battery_level = {
      min: Math.min(...batteryLevelValues),
      max: Math.max(...batteryLevelValues),
      avg: batteryLevelValues.reduce((sum, val) => sum + val, 0) / batteryLevelValues.length,
      latest: batteryLevelValues[batteryLevelValues.length - 1]
    };
  }

  if (hasBatteryVoltage && batteryVoltageValues.length > 0) {
    stats.battery_voltage = {
      min: Math.min(...batteryVoltageValues),
      max: Math.max(...batteryVoltageValues),
      avg: batteryVoltageValues.reduce((sum, val) => sum + val, 0) / batteryVoltageValues.length,
      latest: batteryVoltageValues[batteryVoltageValues.length - 1]
    };
  }

  return stats;
};