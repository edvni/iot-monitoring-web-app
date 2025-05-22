// src/types/SensorData.ts
// TypeScript file for defining types and conversion functions related to sensor data

/**
 * Represents a single measurement reading with humidity, temperature, and timestamp
 */
export interface MeasurementItem {
    h: string;
    t: string;
    ts: string;
}

/**
 * Represents a collection of measurements for a specific day
 */
export interface DailyMeasurement {
    day: string;
    measurements: MeasurementItem[];
    tag_id: string;
    battery_level?: string;
    battery_voltage?: string;
}

/**
 * Represents processed sensor data in a standardized format
 */
export interface SensorData {
    temperature: number;
    humidity: number;
    tag_id: string;
    battery_level?: string;
    battery_voltage?: string;
    timestamp: {
        seconds: number;
        nanoseconds: number;
    };
}

/**
 * Converts DailyMeasurement format to SensorData format for a specific measurement
 * @param dailyMeasurement - The daily measurement data to convert from
 * @param measurementIndex - Index of the specific measurement in the daily array
 * @returns Converted SensorData object
 * @throws Will throw an error if measurement index is out of bounds
 * 
 * @example
 * const dailyData: DailyMeasurement = {
 *   day: "2023-05-15",
 *   measurements: [{ h: "45.2", t: "22.5", ts: "14:30:00" }],
 *   tag_id: "sensor-1"
 * };
 * 
 * const sensorData = convertToSensorData(dailyData, 0);
 * // Returns: {
 * //   temperature: 22.5,
 * //   humidity: 45.2,
 * //   tag_id: "sensor-1",
 * //   timestamp: { seconds: 1684153800, nanoseconds: 0 }
 * // }
 */
export function convertToSensorData(dailyMeasurement: DailyMeasurement, measurementIndex: number): SensorData {
    try {
        // Get specific measurement from daily array
        const measurement = dailyMeasurement.measurements[measurementIndex];

        if (!measurement) {
            console.error("Measurement not found at index", measurementIndex);
            throw new Error(`Measurement not found at index ${measurementIndex}`);
        }

        // Parse time components from "HH:MM:SS" format
        const [hours, minutes, seconds] = measurement.ts.split(':').map(Number);
        // Parse date components from "YYYY-MM-DD" format
        const [year, month, day] = dailyMeasurement.day.split('-').map(Number);
        // Create JavaScript Date object combining date and time
        const date = new Date(year, month - 1, day, hours, minutes, seconds);

        // Return formatted sensor data
        const result = {
            temperature: parseFloat(measurement.t),
            humidity: parseFloat(measurement.h),
            tag_id: dailyMeasurement.tag_id,
            battery_level: dailyMeasurement.battery_level,
            battery_voltage: dailyMeasurement.battery_voltage,
            timestamp: {
                seconds: Math.floor(date.getTime() / 1000), // Convert to Unix timestamp
                nanoseconds: 0, // Currently unused but kept for Firestore compatibility
            }
        };

        return result;
    } catch (error) {
        console.error("Error converting measurement:", error);

        // Return fallback data with current timestamp in case of error
        return {
            temperature: 0,
            humidity: 0,
            tag_id: dailyMeasurement.tag_id || "unknown",
            timestamp: {
                seconds: Date.now() / 1000,
                nanoseconds: 0,
            }
        };
    }
}