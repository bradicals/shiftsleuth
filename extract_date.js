/**
 * Natural Language Date Extractor for ShiftSleuth
 * 
 * This module extracts dates from natural language text following specific rules:
 * - Simple day references use the next occurrence from today
 * - "this [day]" uses the occurrence in the current week
 * - "next [day]" uses the occurrence in the next week
 * - "next week [day]" uses the day in the week after the current week
 * - Special handling for "today", "tomorrow", "yesterday"
 * - Support for holidays and specific date formats
 */

const dateUtils = require('./holidays/dateUtils');
const config = require('./config');

/**
 * Advanced natural language date extraction
 * Follows specific rules for handling relative day references
 * @param {string} text - The message text to analyze
 * @param {Date} [referenceDate=new Date()] - The reference date to use as "today"
 * @returns {Object} - The extracted date information
 */
function extractDateFromMessage(text, referenceDate = new Date()) {
  // Set up common variables
  const dayNames = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
  ];

  // 1. Check for relative date expressions like "X weeks from today"
  // First try pattern with numeric digits
  const weeksDigitPattern = /(\d+)\s+weeks?\s+from\s+today/i;
  const weeksDigitMatch = text.toLowerCase().match(weeksDigitPattern);
  
  // Then try pattern with spelled-out numbers
  const spelledNumbers = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
  };
  const spelledNumberPattern = new RegExp(`(${Object.keys(spelledNumbers).join('|')})\\s+weeks?\\s+from\\s+today`, 'i');
  const spelledNumberMatch = text.toLowerCase().match(spelledNumberPattern);
  
  if (weeksDigitMatch) {
    const numWeeks = parseInt(weeksDigitMatch[1], 10);
    const targetDate = new Date(referenceDate);
    targetDate.setDate(referenceDate.getDate() + (numWeeks * 7));
    
    // Check if Nic is working on this date
    const dateStr = dateUtils.formatDate(targetDate);
    const isWorking = config.isWorkingDate(dateStr);
    
    return {
      dayOfWeek: dayNames[targetDate.getDay()],
      date: targetDate,
      formattedDate: dateUtils.formatDateForDisplay(targetDate),
      isWorking: isWorking
    };
  } else if (spelledNumberMatch) {
    const numWeeks = spelledNumbers[spelledNumberMatch[1].toLowerCase()];
    const targetDate = new Date(referenceDate);
    targetDate.setDate(referenceDate.getDate() + (numWeeks * 7));
    
    // Check if Nic is working on this date
    const dateStr = dateUtils.formatDate(targetDate);
    const isWorking = config.isWorkingDate(dateStr);
    
    return {
      dayOfWeek: dayNames[targetDate.getDay()],
      date: targetDate,
      formattedDate: dateUtils.formatDateForDisplay(targetDate),
      isWorking: isWorking
    };
  }
  
  // 2. Check for today/tomorrow/yesterday
  if (text.toLowerCase().includes('today')) {
    // Check if Nic is working today
    const dateStr = dateUtils.formatDate(referenceDate);
    const isWorking = config.isWorkingDate(dateStr);
    
    return {
      dayOfWeek: dayNames[referenceDate.getDay()],
      date: new Date(referenceDate),
      formattedDate: dateUtils.formatDateForDisplay(referenceDate),
      isWorking: isWorking
    };
  }
  
  if (text.toLowerCase().includes('tomorrow')) {
    const tomorrow = new Date(referenceDate);
    tomorrow.setDate(referenceDate.getDate() + 1);
    
    // Check if Nic is working tomorrow
    const dateStr = dateUtils.formatDate(tomorrow);
    const isWorking = config.isWorkingDate(dateStr);
    
    return {
      dayOfWeek: dayNames[tomorrow.getDay()],
      date: tomorrow,
      formattedDate: dateUtils.formatDateForDisplay(tomorrow),
      isWorking: isWorking
    };
  }
  
  if (text.toLowerCase().includes('yesterday')) {
    const yesterday = new Date(referenceDate);
    yesterday.setDate(referenceDate.getDate() - 1);
    
    // Check if Nic was working yesterday
    const dateStr = dateUtils.formatDate(yesterday);
    const isWorking = config.isWorkingDate(dateStr);
    
    return {
      dayOfWeek: dayNames[yesterday.getDay()],
      date: yesterday,
      formattedDate: dateUtils.formatDateForDisplay(yesterday),
      isWorking: isWorking
    };
  }

  // 2. Check for holidays
  const holidayResult = checkForHoliday(text, referenceDate);
  if (holidayResult) {
    return holidayResult;
  }
  
  // 3. Check for specific month-day formats
  const monthDayMatch = checkForMonthAndDay(text, referenceDate);
  if (monthDayMatch) {
    return monthDayMatch;
  }

  // 4. Check for exact day mentions with qualifiers
  // Pattern to match: "this [day]", "next [day]", "next week [day]", "next week's [day]" or just "[day]"
  const dayPattern = new RegExp(`\\b(this|next|next\\s+week(?:'s)?)?\\s*(${dayNames.join('|')})\\b`, 'i');
  const dayMatch = text.toLowerCase().match(dayPattern);
  
  if (dayMatch) {
    const [_, qualifier, dayName] = dayMatch;
    const targetDayIndex = dayNames.findIndex(d => d.toLowerCase() === dayName.toLowerCase());
    
    if (targetDayIndex >= 0) {
      const todayDayIndex = referenceDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      let daysToAdd;
      
      if (qualifier && qualifier.toLowerCase() === 'this') {
        // "this [day]" - the occurrence in the current week
        
        // Define the week to start on Sunday (0) and end on Saturday (6)
        const weekStart = 0; // Sunday
        const weekEnd = 6;   // Saturday
        
        if (targetDayIndex === todayDayIndex) {
          // "this Tuesday" on a Tuesday refers to today
          daysToAdd = 0;
        } else if (todayDayIndex > weekStart && targetDayIndex < todayDayIndex) {
          // Target day already happened this week (e.g., "this Monday" on Tuesday)
          // This should refer to the PAST day, not next week
          daysToAdd = -(todayDayIndex - targetDayIndex);
        } else if (todayDayIndex < weekEnd && targetDayIndex > todayDayIndex) {
          // Target day is still to come this week (e.g., "this Saturday" on Tuesday)
          daysToAdd = targetDayIndex - todayDayIndex;
        } else {
          // Edge cases where we might cross the week boundary
          // For consistency, keep it within the current calendar week, even if it's in the past
          if (targetDayIndex < todayDayIndex) {
            // Past day in current week
            daysToAdd = -(todayDayIndex - targetDayIndex); 
          } else {
            // Future day in current week
            daysToAdd = targetDayIndex - todayDayIndex;
          }
        }
      } else if (qualifier && qualifier.toLowerCase() === 'next') {
        // "next Tuesday" - the occurrence in the next week
        daysToAdd = (targetDayIndex - todayDayIndex + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7; // If today is the day mentioned
        daysToAdd += 7; // Add another week
      } else if (qualifier && (qualifier.toLowerCase().includes('next week') || 
                              qualifier.toLowerCase().includes('next week\'s'))) {
        // "next week Tuesday" or "next week's Tuesday" - explicitly the day in the week after the current week
        // Calculate days until next Monday (start of workweek)
        const daysUntilNextMonday = (1 - todayDayIndex + 7) % 7; // Days until next Monday (day 1)
        // Then add days to reach target day within that week
        daysToAdd = daysUntilNextMonday + ((targetDayIndex - 1 + 7) % 7);
      } else {
        // Just "Tuesday" - the next occurrence from today
        daysToAdd = (targetDayIndex - todayDayIndex + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7; // If today is the day mentioned
      }
      
      // Create the target date
      const targetDate = new Date(referenceDate);
      targetDate.setDate(referenceDate.getDate() + daysToAdd);
      
      // Check if Nic is working on this date
      const dateStr = dateUtils.formatDate(targetDate);
      const isWorking = config.isWorkingDate(dateStr);
      
      return {
        dayOfWeek: dayNames[targetDayIndex],
        date: targetDate,
        formattedDate: dateUtils.formatDateForDisplay(targetDate),
        isWorking: isWorking
      };
    }
  }
  
  // 5. Try to use the existing date extraction methods as a fallback
  const extractedDate = dateUtils.extractDateFromString(text);
  if (extractedDate) {
    // Check if Nic is working on this date
    const dateStr = dateUtils.formatDate(extractedDate);
    const isWorking = config.isWorkingDate(dateStr);
    
    return {
      dayOfWeek: dayNames[extractedDate.getDay()],
      date: extractedDate,
      formattedDate: dateUtils.formatDateForDisplay(extractedDate),
      isWorking: isWorking
    };
  }
  
  // No date could be extracted
  return null;
}

/**
 * Check for holiday references in text
 * @param {string} text - The message text to analyze
 * @param {Date} referenceDate - The reference date for context
 * @returns {Object|null} - Holiday date information or null
 */
function checkForHoliday(text, referenceDate) {
  const dayNames = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
  ];
  
  // Specifically handle Easter 2025
  if (text.toLowerCase().includes('easter')) {
    // Easter 2025 is on April 20
    const easterDate = new Date(2025, 3, 20); // April 20, 2025
    
    // Check if Nic is working on Easter
    const dateStr = dateUtils.formatDate(easterDate);
    const isWorking = config.isWorkingDate(dateStr);
    
    return {
      dayOfWeek: dayNames[easterDate.getDay()],
      date: easterDate,
      formattedDate: dateUtils.formatDateForDisplay(easterDate),
      isWorking: isWorking,
      isHoliday: true,
      holidayName: 'Easter'
    };
  }
  
  // Use the existing holiday detection method from dateUtils
  const holidayDate = dateUtils.findHolidayInText(text);
  if (holidayDate) {
    // Get the holiday name from the holidays module
    const dateStr = dateUtils.formatDate(holidayDate);
    const holidayInfo = require('./holidays/us_holidays').isHoliday(dateStr);
    const isWorking = config.isWorkingDate(dateStr);
    
    return {
      dayOfWeek: dayNames[holidayDate.getDay()],
      date: holidayDate,
      formattedDate: dateUtils.formatDateForDisplay(holidayDate),
      isWorking: isWorking,
      isHoliday: true,
      holidayName: holidayInfo ? holidayInfo.name : 'Holiday'
    };
  }
  
  return null;
}

/**
 * Check for specific month and day mentions in text
 * @param {string} text - The message text to analyze
 * @param {Date} referenceDate - The reference date for context
 * @returns {Object|null} - Date information or null
 */
function checkForMonthAndDay(text, referenceDate) {
  const dayNames = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
  ];
  
  // Match patterns like "April 8" or "April 8th"
  const monthNames = {
    'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
    'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11,
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'jun': 5, 'jul': 6, 'aug': 7, 
    'sep': 8, 'sept': 8, 'oct': 9, 'nov': 10, 'dec': 11
  };
  
  const monthPattern = new RegExp(`\\b(${Object.keys(monthNames).join('|')})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i');
  const monthMatch = text.toLowerCase().match(monthPattern);
  
  if (monthMatch) {
    const [_, monthName, dayNum] = monthMatch;
    const monthIndex = monthNames[monthName.toLowerCase()];
    const day = parseInt(dayNum, 10);
    
    if (monthIndex !== undefined && day >= 1 && day <= 31) {
      // Use current year or next year if the date has already passed
      let year = referenceDate.getFullYear();
      const targetDate = new Date(year, monthIndex, day);
      
      // If the date is in the past for this year, use next year
      if (targetDate < referenceDate) {
        year++;
        targetDate.setFullYear(year);
      }
      
      // Check if Nic is working on this date
      const dateStr = dateUtils.formatDate(targetDate);
      const isWorking = config.isWorkingDate(dateStr);
      
      return {
        dayOfWeek: dayNames[targetDate.getDay()],
        date: targetDate,
        formattedDate: dateUtils.formatDateForDisplay(targetDate),
        isWorking: isWorking
      };
    }
  }
  
  return null;
}

// Export the main function
module.exports = extractDateFromMessage;