// Test script for natural language date extraction
const dateUtils = require('./holidays/dateUtils');
const config = require('./config');

/**
 * Advanced natural language date extraction
 * Follows specific rules for handling relative day references
 * @param {string} text - The message text to analyze
 * @returns {Object} - The extracted date information
 */
function extractSpecificDateFromText(text) {
  // Today's date for reference (March 18, 2025)
  const today = new Date(2025, 2, 18); // Month is 0-indexed in JavaScript
  const dayNames = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
  ];

  // 1. Check for today/tomorrow/yesterday first (highest priority)
  if (text.toLowerCase().includes('today')) {
    // Check if Nic is working today
    const dateStr = dateUtils.formatDate(today);
    const isWorking = config.isWorkingDate(dateStr);
    
    return {
      dayOfWeek: dayNames[today.getDay()],
      date: today,
      formattedDate: dateUtils.formatDateForDisplay(today),
      isWorking: isWorking
    };
  }
  
  if (text.toLowerCase().includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
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
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
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
  const holidayResult = checkForHoliday(text, today);
  if (holidayResult) {
    return holidayResult;
  }
  
  // 3. Check for specific month-day formats
  const monthDayMatch = checkForMonthAndDay(text, today);
  if (monthDayMatch) {
    return monthDayMatch;
  }

  // 4. Check for exact day mentions with qualifiers
  // Pattern to match: "this [day]", "next [day]", "next week [day]" or just "[day]"
  const dayPattern = new RegExp(`\\b(this|next|next\\s+week)?\\s*(${dayNames.join('|')})\\b`, 'i');
  const dayMatch = text.toLowerCase().match(dayPattern);
  
  if (dayMatch) {
    const [_, qualifier, dayName] = dayMatch;
    const targetDayIndex = dayNames.findIndex(d => d.toLowerCase() === dayName.toLowerCase());
    
    if (targetDayIndex >= 0) {
      const todayDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      let daysToAdd;
      
      if (qualifier && qualifier.toLowerCase() === 'this') {
        // "this Tuesday" - the occurrence in the current week
        daysToAdd = (targetDayIndex - todayDayIndex + 7) % 7;
        if (daysToAdd === 0 && targetDayIndex !== todayDayIndex) daysToAdd = 7; // If we wrapped around
      } else if (qualifier && qualifier.toLowerCase() === 'next') {
        // "next Tuesday" - the occurrence in the next week
        daysToAdd = (targetDayIndex - todayDayIndex + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7; // If today is the day mentioned
        daysToAdd += 7; // Add another week
      } else if (qualifier && qualifier.toLowerCase().includes('next week')) {
        // "next week Tuesday" - explicitly the day in the week after the current week
        const daysUntilNextWeekStart = (7 - todayDayIndex) % 7; // Days until next Sunday
        daysToAdd = daysUntilNextWeekStart + targetDayIndex; // Next week's day
      } else {
        // Just "Tuesday" - the next occurrence from today
        daysToAdd = (targetDayIndex - todayDayIndex + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7; // If today is the day mentioned
      }
      
      // Create the target date
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysToAdd);
      
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
 * @param {Date} today - Today's date for reference
 * @returns {Object|null} - Holiday date information or null
 */
function checkForHoliday(text, today) {
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
 * @param {Date} today - Today's date for reference
 * @returns {Object|null} - Date information or null
 */
function checkForMonthAndDay(text, today) {
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
      let year = today.getFullYear();
      const targetDate = new Date(year, monthIndex, day);
      
      // If the date is in the past for this year, use next year
      if (targetDate < today) {
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

// Test cases
const testCases = [
  // Basic day references
  "does Nic work on Friday?",                   // Simple day (this week's Friday)
  "can we meet next Friday?",                   // Next week's Friday
  "next week Friday works for me",              // Explicit next week Friday
  "this Wednesday",                             // This week's Wednesday
  
  // Relative day references
  "does Nic work tomorrow?",                    // Tomorrow
  "yesterday was busy",                         // Yesterday
  "is Nic working on next Tuesday?",            // Next week's Tuesday
  "can Nic meet on next week Monday?",          // Explicit next week Monday
  "is Nic working this Sunday?",                // This week's Sunday
  "does Nic work Tuesday?",                     // Next Tuesday
  
  // Holiday references
  "is Nic working on Easter?",                  // Holiday
  "will Nic be at the milk plant on Christmas?", // Christmas 
  "is Nic working on Thanksgiving?",            // Thanksgiving
  "does Nic work on Halloween?",                // Halloween
  
  // Month-day format
  "does Nic have a shift next month on Tuesday, April 8?", // Specific date
  "will Nic be at the milk plant on April 15?", // Specific date
  "Nic is scheduled for May 1",                 // Specific date
  
  // Multiple date references (should pick the first valid one)
  "will Nic be at the milk plant on Saturday or Sunday?", // This week's Saturday
  "is Nic working tomorrow or Friday?",         // Tomorrow
  
  // Edge cases
  "does Nic work today?",                       // Today
  "is Nic working next week?",                  // Generic next week (should return null)
  "when is Nic's next shift?",                  // No specific date (should return null)
];

console.log("TODAY'S DATE: Tuesday, March 18, 2025\n");

// Process each test case
testCases.forEach(text => {
  console.log(`Message: "${text}"`);
  const result = extractSpecificDateFromText(text);
  
  if (result) {
    const holidayInfo = result.isHoliday ? ` (${result.holidayName})` : '';
    console.log(`  Extracted date: ${result.formattedDate}${holidayInfo}`);
    
    if (result.isWorking) {
      console.log(`  Status: Nic IS working at the milk plant on this date 💼`);
    } else {
      console.log(`  Status: Nic is NOT working at the milk plant on this date 🎮`);
    }
  } else {
    console.log(`  No specific date could be extracted.`);
  }
  console.log("");
});