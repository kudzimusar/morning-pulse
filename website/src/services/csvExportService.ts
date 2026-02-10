/**
 * CSV Export Service
 * Provides utility functions to export dashboard data to CSV format.
 */

export const exportToCSV = (data: any[], fileName: string) => {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Get headers from the first object
    const headers = Object.keys(data[0]);

    // Create rows
    const rows = data.map(obj =>
        headers.map(header => {
            let value = obj[header];

            // Handle null/undefined
            if (value === null || value === undefined) value = '';

            // Handle objects/arrays (convert to string)
            if (typeof value === 'object') value = JSON.stringify(value);

            // Handle strings with commas (escape them)
            if (typeof value === 'string' && value.includes(',')) {
                value = `"${value.replace(/"/g, '""')}"`;
            }

            return value;
        }).join(',')
    );

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
