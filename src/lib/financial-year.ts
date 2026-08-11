/**
 * specific date logic for Financial Year (April 1 to March 31)
 */

export function getFinancialYear(date: Date = new Date()) {
    const month = date.getMonth(); // 0 = Jan, 11 = Dec
    const year = date.getFullYear();

    // Financial year starts on April 1st.
    // If month is Jan(0), Feb(1), or Mar(2), we are in the tail end of the previous year's FY.
    // Example: March 2025 is FY 2024-2025.
    // Example: April 2025 is FY 2025-2026.

    let startYear = year;
    let endYear = year + 1;

    if (month < 3) { // Jan, Feb, Mar
        startYear = year - 1;
        endYear = year;
    }

    return {
        startYear,
        endYear,
        label: `${startYear}-${endYear}`, // e.g., "2024-2025"
        startDate: new Date(startYear, 3, 1), // April 1st
        endDate: new Date(endYear, 2, 31) // March 31st
    };
}
