// utils/exportToCsv.ts

/**
  * Exports an array of objects to a CSV file and triggers a download in the browser.
  * 
  * @param filename - The name of the file to be downloaded (e.g. "data.csv")
  * @param data - An array of objects where each object represents a row in the CSV
  * @returns void - If there's no data to export, the function returns early
  */
export const exportToCsv = (filename: string, data: any[]) => {
    // Check if data is empty
    if (!data.length) {
        console.error("No data to export");
        return;
    }

    /**
     * Escapes a value for proper CSV formatting
     * @param value - The value to be scaped
     * @returns The properly escaped CSV string representation of the value
     */
    const escapeCsvValue = (value: any): string => {
      if (value == null) return "";
      if (typeof value === "number") return value.toString();
      if (typeof value === "string") {
        const escaped = value.replace(/"/g, '""'); // Escape double quotes
        return `"${escaped}"`; // Enclose in double quotes if it contains commas or quotes
      }
      return `"${JSON.stringify(value).replace(/"/g, '""')}"`; // Fallback for objects
    };

    // Extract headers from the first object in the array
    const headers = Object.keys(data[0]);

    // Create CSV content starting with headers
    let csvContent = headers.join(",") + "\n";

    // Process each data row
    data.forEach(item => {
      // Create a CSV row by mapping each header to its escaped value
      const row = headers.map(header => escapeCsvValue(item[header])).join(",");
      csvContent += row + '\n';
    });

    // Create download link for the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    // Trigger the download
    document.body.appendChild(link);
    link.click();

    // Clean up by removing the link and revoking the object URL
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}