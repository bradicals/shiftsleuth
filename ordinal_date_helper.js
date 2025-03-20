/**
 * Ordinal Date Helper
 * 
 * Helper functions for calculating ordinal dates like "first Tuesday of April"
 */

const logger = require('./logger');

/**
 * Get the date for a specific ordinal weekday in a month
 * e.g., "first Tuesday of April 2025"
 * 
 * @param {number} ordinal - 1 for first, 2 for second, etc.
 * @param {number} dayOfWeek - 0 for Sunday, 1 for Monday, etc. (JS Date standard)
 * @param {number} month - 0 for January, 1 for February, etc. (JS Date standard)
 * @param {number} year - Full year (e.g., 2025)
 * @returns {Date} - The calculated date
 */
function getOrdinalWeekdayInMonth(ordinal, dayOfWeek, month, year) {
    // Ensure the ordinal is valid (1-5)
    if (ordinal < 1 || ordinal > 5) {
        throw new Error(`Invalid ordinal: ${ordinal}. Must be between 1 and 5.`);
    }
    
    // Ensure day of week is valid (0-6)
    if (dayOfWeek < 0 || dayOfWeek > 6) {
        throw new Error(`Invalid day of week: ${dayOfWeek}. Must be between 0 and 6.`);
    }
    
    // Ensure month is valid (0-11)
    if (month < 0 || month > 11) {
        throw new Error(`Invalid month: ${month}. Must be between 0 and 11.`);
    }
    
    // CORRECTED ALGORITHM:
    // Get all occurrences of the target day of week in the month
    // Write to log file for ordinal date calculations
    const fs = require('fs');
    const logDir = './logs';
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    
    const occurrences = [];
    const date = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    
    // Log the initial calculation data
    const initialLog = {
      calculationType: 'ordinal_date',
      ordinal: ordinal,
      dayOfWeek: dayOfWeek,
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
      month: month,
      monthName: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month],
      year: year,
      firstDayOfMonth: date.toISOString().split('T')[0],
      firstDayOfMonthDayOfWeek: date.getDay(),
      lastDayOfMonth: endOfMonth.toISOString().split('T')[0]
    };
    
    const timestamp = new Date().toISOString();
    fs.appendFileSync(`${logDir}/ordinal_date.log`, `\n\n[${timestamp}] ORDINAL DATE CALCULATION START\n${JSON.stringify(initialLog, null, 2)}`);
    
    // Start with first day of month and iterate through all days
    while (date <= endOfMonth) {
        if (date.getDay() === dayOfWeek) {
            occurrences.push(new Date(date));
        }
        date.setDate(date.getDate() + 1);
    }
    
    // Verify the calculation and log results
    const occurrenceResults = {
        month: getMonthName(month),
        year: year,
        dayOfWeek: getDayName(dayOfWeek),
        total: occurrences.length,
        dates: {}
    };
    
    occurrences.forEach((d, i) => {
        const ordinalStr = `${i+1}${getOrdinalSuffix(i+1)}`;
        occurrenceResults.dates[ordinalStr] = d.toISOString().split('T')[0];
    });
    
    // Write to log file
    fs.appendFileSync(`${logDir}/ordinal_date.log`, `\n[${timestamp}] FOUND OCCURRENCES\n${JSON.stringify(occurrenceResults, null, 2)}`);
    
    // Log to console too
    console.log(`Found ${occurrences.length} occurrences of ${getDayName(dayOfWeek)} in ${getMonthName(month)} ${year}:`);
    Object.entries(occurrenceResults.dates).forEach(([ordinal, date]) => {
        console.log(`  ${ordinal} ${getDayName(dayOfWeek)}: ${date}`);
    });
    
    // Check if the requested ordinal occurrence exists
    if (ordinal > occurrences.length) {
        const errorMsg = `Warning: There is no ${ordinal}${getOrdinalSuffix(ordinal)} ${getDayName(dayOfWeek)} in ${getMonthName(month)} ${year}`;
        console.error(errorMsg);
        fs.appendFileSync(`${logDir}/ordinal_date.log`, `\n[${timestamp}] ERROR: ${errorMsg}`);
        return null;
    }
    
    // Return the correct occurrence (arrays are 0-based, so ordinal-1)
    const result = occurrences[ordinal - 1];
    
    // Log the final result
    const resultLog = {
        ordinal: `${ordinal}${getOrdinalSuffix(ordinal)}`,
        dayOfWeek: getDayName(dayOfWeek),
        month: getMonthName(month),
        year: year,
        date: result.toISOString().split('T')[0],
        dayOfMonth: result.getDate()
    };
    
    fs.appendFileSync(`${logDir}/ordinal_date.log`, `\n[${timestamp}] FINAL RESULT\n${JSON.stringify(resultLog, null, 2)}`);
    console.log(`${ordinal}${getOrdinalSuffix(ordinal)} ${getDayName(dayOfWeek)} of ${getMonthName(month)} ${year} is ${result.toISOString().split('T')[0]}`);
    
    
    return result;
}

/**
 * Get ordinal suffix (st, nd, rd, th) for a number
 */
function getOrdinalSuffix(n) {
    if (n >= 11 && n <= 13) {
        return 'th';
    }
    switch (n % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

/**
 * Get day name from day number
 */
function getDayName(day) {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
}

/**
 * Get month name from month number
 */
function getMonthName(month) {
    return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month];
}

/**
 * Check if a string contains an ordinal day pattern
 * e.g., "first Tuesday of April", "2nd Monday in May", etc.
 * 
 * @param {string} text - The text to check
 * @returns {Object|null} - Parsed information or null if no match
 */
function parseOrdinalDayPattern(text) {
    // Convert text to lowercase for easier matching
    const lowerText = text.toLowerCase();
    
    // Define patterns for ordinal numbers
    const ordinalPatterns = {
        'first': 1, '1st': 1, 'second': 2, '2nd': 2, 'third': 3, '3rd': 3,
        'fourth': 4, '4th': 4, 'fifth': 5, '5th': 5, 'last': -1
    };
    
    // Define patterns for days of week
    const dayPatterns = {
        'sunday': 0, 'sun': 0, 'monday': 1, 'mon': 1, 'tuesday': 2, 'tue': 2, 'tues': 2,
        'wednesday': 3, 'wed': 3, 'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
        'friday': 5, 'fri': 5, 'saturday': 6, 'sat': 6
    };
    
    // Define patterns for months
    const monthPatterns = {
        'january': 0, 'jan': 0, 'february': 1, 'feb': 1, 'march': 2, 'mar': 2,
        'april': 3, 'apr': 3, 'may': 4, 'june': 5, 'jun': 5, 'july': 6, 'jul': 6,
        'august': 7, 'aug': 7, 'september': 8, 'sep': 8, 'sept': 8, 'october': 9, 'oct': 9,
        'november': 10, 'nov': 10, 'december': 11, 'dec': 11
    };
    
    // Regex pattern for "ordinal day of/in month"
    // e.g., "first Tuesday of April", "2nd Monday in May"
    const regex = new RegExp(
        `(${Object.keys(ordinalPatterns).join('|')})\\s+` + // ordinal (first, 2nd, etc.)
        `(${Object.keys(dayPatterns).join('|')})\\s+` +     // day of week (Monday, Tue, etc.)
        `(?:of|in|of the month of|in the month of|within)\\s+` +  // connector (of, in)
        `(${Object.keys(monthPatterns).join('|')})`,        // month (April, Jun, etc.)
        'i'
    );
    
    const match = lowerText.match(regex);
    if (!match) {
        return null;
    }
    
    // Extract the parts
    const [_, ordinalText, dayText, monthText] = match;
    
    // Convert to numbers
    const ordinal = ordinalPatterns[ordinalText.toLowerCase()];
    const dayOfWeek = dayPatterns[dayText.toLowerCase()];
    const month = monthPatterns[monthText.toLowerCase()];
    
    // Get the current year
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    let targetYear = year;
    
    // Check if we need to use next year (if the month has already passed this year)
    if (month < currentDate.getMonth()) {
        targetYear = year + 1;
    }
    
    // Handle "last" day of month
    if (ordinal === -1) {
        // To find the last occurrence, we need to:
        // 1. Go to the first day of the next month
        // 2. Subtract one day to get the last day of the target month
        // 3. Find the last occurrence of the target weekday by going backward
        
        const lastDayOfMonth = new Date(targetYear, month + 1, 0);
        const targetDate = new Date(lastDayOfMonth);
        
        // Calculate days to subtract to reach the last occurrence of the target weekday
        const daysToSubtract = (lastDayOfMonth.getDay() - dayOfWeek + 7) % 7;
        targetDate.setDate(lastDayOfMonth.getDate() - daysToSubtract);
        
        return {
            ordinal: 'last',
            dayOfWeek,
            month,
            year: targetYear,
            date: targetDate
        };
    }
    
    // Calculate the target date
    const targetDate = getOrdinalWeekdayInMonth(ordinal, dayOfWeek, month, targetYear);
    
    if (!targetDate) {
        return null; // The specified ordinal weekday doesn't exist in this month
    }
    
    return {
        ordinal,
        dayOfWeek,
        month,
        year: targetYear,
        date: targetDate
    };
}

module.exports = {
    getOrdinalWeekdayInMonth,
    parseOrdinalDayPattern
};