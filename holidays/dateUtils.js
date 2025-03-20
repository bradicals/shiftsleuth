// Date utility functions for ShiftSleuth
module.exports = {
  /**
   * Parse a date from various formats like MM/DD/YYYY, MM-DD-YYYY, or natural language
   * Returns a Date object if valid, null if invalid
   */
  parseDate(dateString) {
    // Check if it's already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Check for MM/DD/YYYY format
    const slashFormat = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    if (slashFormat.test(dateString)) {
      const [_, month, day, year] = dateString.match(slashFormat);
      const date = new Date(year, month - 1, day);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Check for MM-DD-YYYY format
    const dashFormat = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
    if (dashFormat.test(dateString)) {
      const [_, month, day, year] = dateString.match(dashFormat);
      const date = new Date(year, month - 1, day);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Try natural language parsing as fallback
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch (e) {
      return null;
    }
  },
  
  /**
   * Convert a Date object to YYYY-MM-DD format
   * Use Eastern Time (ET) for Michigan timezone consistency
   */
  formatDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return null;
    }
    
    // Convert to Eastern Time (Michigan timezone)
    // Options for Eastern Time formatting
    const options = { 
      timeZone: 'America/Detroit',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    
    // Get date parts in Eastern Time
    const etDateString = new Intl.DateTimeFormat('en-US', options).format(date);
    // Convert from MM/DD/YYYY to YYYY-MM-DD
    const [month, day, year] = etDateString.split('/');
    
    return `${year}-${month}-${day}`;
  },
  
  /**
   * Check if a date string contains a valid date pattern that can be extracted
   */
  extractDateFromString(text) {
    // Look for MM/DD/YYYY pattern
    const slashMatch = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
    if (slashMatch) {
      const [full, month, day, year] = slashMatch;
      if (month > 0 && month <= 12 && day > 0 && day <= 31) {
        return new Date(year, month - 1, day);
      }
    }
    
    // Look for MM-DD-YYYY pattern
    const dashMatch = text.match(/\b(\d{1,2})-(\d{1,2})-(\d{4})\b/);
    if (dashMatch) {
      const [full, month, day, year] = dashMatch;
      if (month > 0 && month <= 12 && day > 0 && day <= 31) {
        return new Date(year, month - 1, day);
      }
    }
    
    // Look for YYYY-MM-DD pattern
    const isoMatch = text.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
    if (isoMatch) {
      const [full, year, month, day] = isoMatch;
      if (month > 0 && month <= 12 && day > 0 && day <= 31) {
        return new Date(year, month - 1, day);
      }
    }
    
    // Try to find month names with days and years
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june', 
      'july', 'august', 'september', 'october', 'november', 'december',
      'jan', 'feb', 'mar', 'apr', 'may', 'jun', 
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
    ];
    
    const monthPattern = new RegExp(`\\b(${monthNames.join('|')})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:[,\\s]+)(\\d{4})\\b`, 'i');
    const monthMatch = text.match(monthPattern);
    
    if (monthMatch) {
      const [full, monthName, day, year] = monthMatch;
      const monthIndex = monthNames.findIndex(m => 
        m.toLowerCase() === monthName.toLowerCase()
      ) % 12;
      
      if (monthIndex >= 0 && day > 0 && day <= 31) {
        return new Date(year, monthIndex, day);
      }
    }
    
    // Look for days of the week (Monday, Tuesday, etc.)
    const today = new Date();
    const dayNames = [
      'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
    ];
    
    // Check for specific days of the week
    const dayRegex = new RegExp(`\\b(this|next|coming|on)? ?(${dayNames.join('|')})\\b`, 'i');
    const dayMatch = text.match(dayRegex);
    
    if (dayMatch) {
      const [full, qualifier, dayName] = dayMatch;
      const targetDayIndex = dayNames.findIndex(d => 
        d.toLowerCase() === dayName.toLowerCase()
      );
      
      if (targetDayIndex >= 0) {
        // Get today's date components in Eastern Time (Michigan)
        const etOptions = { 
          timeZone: 'America/Detroit',
          year: 'numeric', 
          month: 'numeric', 
          day: 'numeric' 
        };
        const etDateParts = new Intl.DateTimeFormat('en-US', etOptions).formatToParts(today);
        
        // Extract date parts
        const etYear = parseInt(etDateParts.find(part => part.type === 'year').value);
        const etMonth = parseInt(etDateParts.find(part => part.type === 'month').value) - 1;
        const etDay = parseInt(etDateParts.find(part => part.type === 'day').value);
        
        // Create date with Eastern Time components
        const todayET = new Date(etYear, etMonth, etDay, 12, 0, 0, 0); // Use noon to avoid DST issues
        
        // Get the day of week in Eastern Time
        const etDayIndex = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Detroit', weekday: 'short' })
          .formatToParts(today)
          .find(part => part.type === 'weekday')
          .value;
          
        // Map the weekday name to index (0 = Sunday, 1 = Monday, etc.)
        const weekdayMap = {
          'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
        };
        const todayDayIndex = weekdayMap[etDayIndex];
        let daysToAdd;
        
        // Handle different qualifiers
        const hasQualifier = qualifier && qualifier.toLowerCase();
        
        if (hasQualifier && hasQualifier === 'this') {
          // "This Tuesday" - refers to the current week's Tuesday
          daysToAdd = (targetDayIndex - todayDayIndex);
          if (daysToAdd < 0) daysToAdd += 7; // If the day has passed this week
        } else if (hasQualifier && hasQualifier === 'next') {
          // "Next Tuesday" - refers to the Tuesday of next week
          daysToAdd = (targetDayIndex - todayDayIndex + 7) % 7;
          daysToAdd += 7; // Always go to next week
        } else {
          // Just "Tuesday" - refers to the next occurrence of Tuesday
          daysToAdd = (targetDayIndex - todayDayIndex + 7) % 7;
          if (daysToAdd === 0) daysToAdd = 7; // If today is the day mentioned, go to next week
        }
        
        // Create a new date using Eastern Time components
        return new Date(
          etYear,
          etMonth,
          etDay + daysToAdd,
          12, 0, 0, 0
        );
      }
    }
    
    // Check for common date phrases using Eastern Time
    // Get today's date components in Eastern Time (Michigan)
    const etOptions = { 
      timeZone: 'America/Detroit',
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric' 
    };
    const etDateParts = new Intl.DateTimeFormat('en-US', etOptions).formatToParts(today);
    
    // Extract date parts
    const etYear = parseInt(etDateParts.find(part => part.type === 'year').value);
    const etMonth = parseInt(etDateParts.find(part => part.type === 'month').value) - 1;
    const etDay = parseInt(etDateParts.find(part => part.type === 'day').value);
    
    // Today in Eastern Time
    const todayET = new Date(etYear, etMonth, etDay, 12, 0, 0, 0); // Use noon to avoid DST issues
    
    if (/\btoday\b/i.test(text)) {
      return todayET;
    }
    
    if (/\btomorrow\b/i.test(text) || /\bnext day\b/i.test(text)) {
      return new Date(
        etYear,
        etMonth,
        etDay + 1,
        12, 0, 0, 0
      );
    }
    
    if (/\byesterday\b/i.test(text) || /\bprevious day\b/i.test(text)) {
      return new Date(
        etYear,
        etMonth,
        etDay - 1,
        12, 0, 0, 0
      );
    }
    
    // Check for day-after-tomorrow and similar phrases
    if (/\bday after tomorrow\b/i.test(text) || /\bin 2 days\b/i.test(text) || /\bin two days\b/i.test(text)) {
      return new Date(
        etYear,
        etMonth,
        etDay + 2,
        12, 0, 0, 0
      );
    }
    
    // Look for holiday references in the current year
    const holidayMatch = this.findHolidayInText(text);
    if (holidayMatch) {
      return holidayMatch;
    }
    
    // None of the patterns matched
    return null;
  },
  
  /**
   * Find a holiday reference in text and return the date for the current or next occurrence
   */
  findHolidayInText(text) {
    // Access the holidays module
    const holidays = require('./us_holidays');
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Common holiday names
    const holidayKeywords = [
      { name: 'christmas', dateStr: `${currentYear}-12-25` },
      { name: 'xmas', dateStr: `${currentYear}-12-25` }, // Christmas alternative
      { name: 'new year', dateStr: `${currentYear}-01-01` },
      { name: 'new years', dateStr: `${currentYear}-01-01` },
      { name: 'new year\'s', dateStr: `${currentYear}-01-01` },
      { name: 'new year\'s eve', dateStr: `${currentYear}-12-31` },
      { name: 'nye', dateStr: `${currentYear}-12-31` }, // New Year's Eve
      { name: 'thanksgiving', compute: (year) => {
        // Thanksgiving is the 4th Thursday in November
        const nov = new Date(year, 10, 1); // November 1st
        const dayOfWeek = nov.getDay(); // 0 = Sunday, 4 = Thursday
        const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
        const fourthThursday = 1 + daysUntilThursday + (3 * 7); // 1st Thursday + 3 weeks
        return `${year}-11-${fourthThursday}`;
      }},
      { name: 'halloween', dateStr: `${currentYear}-10-31` },
      { name: 'valentine', dateStr: `${currentYear}-02-14` }, // Valentine's Day
      { name: 'valentine\'s', dateStr: `${currentYear}-02-14` }, // Valentine's Day
      { name: 'valentines', dateStr: `${currentYear}-02-14` }, // Valentine's Day (no apostrophe)
      { name: 'st patrick', dateStr: `${currentYear}-03-17` }, // St. Patrick's Day
      { name: 'saint patrick', dateStr: `${currentYear}-03-17` }, // St. Patrick's Day
      { name: 'patrick', dateStr: `${currentYear}-03-17` }, // St. Patrick's Day alternative
      { name: 'st. patrick', dateStr: `${currentYear}-03-17` }, // St. Patrick's Day with period
      { name: 'independence day', dateStr: `${currentYear}-07-04` },
      { name: 'july 4', dateStr: `${currentYear}-07-04` },
      { name: 'july 4th', dateStr: `${currentYear}-07-04` },
      { name: '4th of july', dateStr: `${currentYear}-07-04` },
      { name: 'fourth of july', dateStr: `${currentYear}-07-04` },
      { name: 'memorial day', compute: (year) => {
        // Memorial Day is the last Monday in May
        const may31 = new Date(year, 4, 31); // May 31st
        const dayOfWeek = may31.getDay(); // 0 = Sunday, 1 = Monday
        const daysToSubtract = (dayOfWeek + 6) % 7; // Days to go back to last Monday
        return `${year}-05-${31 - daysToSubtract}`;
      }},
      { name: 'labor day', compute: (year) => {
        // Labor Day is the first Monday in September
        const sept1 = new Date(year, 8, 1); // September 1st
        const dayOfWeek = sept1.getDay(); // 0 = Sunday, 1 = Monday
        const daysToAdd = (1 - dayOfWeek + 7) % 7; // Days to add to get to Monday
        return `${year}-09-${1 + daysToAdd}`;
      }},
      { name: 'mlk', compute: (year) => {
        // MLK Day is the 3rd Monday in January
        const jan1 = new Date(year, 0, 1);
        const dayOfWeek = jan1.getDay();
        const daysUntilMonday = (1 - dayOfWeek + 7) % 7;
        const thirdMonday = 1 + daysUntilMonday + (2 * 7); // 1st Monday + 2 weeks
        return `${year}-01-${thirdMonday}`;
      }},
      { name: 'martin luther king', compute: (year) => {
        // MLK Day is the 3rd Monday in January
        const jan1 = new Date(year, 0, 1);
        const dayOfWeek = jan1.getDay();
        const daysUntilMonday = (1 - dayOfWeek + 7) % 7;
        const thirdMonday = 1 + daysUntilMonday + (2 * 7); // 1st Monday + 2 weeks
        return `${year}-01-${thirdMonday}`;
      }},
      { name: 'easter', compute: (year) => {
        // Easter calculation (approximation, as exact calculation is complex)
        // For 2025, Easter is on April 20
        if (year === 2025) {
          return `2025-04-20`;
        }
        
        // This uses a simplified version of the Gauss Easter algorithm
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      }}
    ];
    
    // Check if any holiday keyword is present in the text
    for (const holiday of holidayKeywords) {
      if (text.toLowerCase().includes(holiday.name.toLowerCase())) {
        let dateStr;
        
        // Get specific fixed dates for certain holidays that have date recognition issues
        // Use UTC dates to avoid timezone issues
        if (holiday.name === 'christmas' || holiday.name === 'xmas') {
          return new Date(Date.UTC(currentYear, 11, 25)); // December 25
        } else if (holiday.name === 'halloween') {
          return new Date(Date.UTC(currentYear, 9, 31)); // October 31
        } else if (holiday.name === 'july 4th' || holiday.name === '4th of july' || 
                   holiday.name === 'july 4' || holiday.name === 'fourth of july' || 
                   holiday.name === 'independence day') {
          return new Date(Date.UTC(currentYear, 6, 4)); // July 4
        } else if (holiday.name === 'valentine' || holiday.name === 'valentine\'s' || 
                   holiday.name === 'valentines') {
          return new Date(Date.UTC(currentYear, 1, 14)); // February 14
        } else if (holiday.name === 'nye' || holiday.name === 'new year\'s eve') {
          return new Date(Date.UTC(currentYear, 11, 31)); // December 31
        } else if (holiday.name === 'st patrick' || holiday.name === 'saint patrick' || 
                   holiday.name === 'patrick' || holiday.name === 'st. patrick') {
          return new Date(Date.UTC(currentYear, 2, 17)); // March 17
        } else if (holiday.name === 'thanksgiving') {
          // Calculate Thanksgiving properly - 4th Thursday in November
          const nov1 = new Date(Date.UTC(currentYear, 10, 1)); // November 1
          const dayOfWeek = nov1.getUTCDay(); // 0 = Sunday, 4 = Thursday
          const daysUntilThursday = (4 - dayOfWeek + 7) % 7; // Days until first Thursday
          const fourthThursday = 1 + daysUntilThursday + (3 * 7); // 1st Thursday + 3 weeks
          return new Date(Date.UTC(currentYear, 10, fourthThursday)); // November
        }
        
        // Compute the date if necessary
        if (holiday.compute) {
          dateStr = holiday.compute(currentYear);
        } else if (typeof holiday.dateStr === 'function') {
          dateStr = holiday.dateStr(currentYear);
        } else {
          dateStr = holiday.dateStr;
        }
        
        // Check if this holiday has already passed this year
        const holidayDate = new Date(dateStr);
        if (holidayDate < today) {
          // If it has passed, get next year's date
          if (holiday.compute) {
            dateStr = holiday.compute(currentYear + 1);
          } else if (typeof holiday.dateStr === 'function') {
            dateStr = holiday.dateStr(currentYear + 1);
          } else {
            // Update the year for fixed-date holidays
            const [_, month, day] = dateStr.split('-');
            dateStr = `${currentYear + 1}-${month}-${day}`;
          }
          holidayDate.setFullYear(currentYear + 1);
        }
        
        return new Date(dateStr);
      }
    }
    
    return null;
  },
  
  /**
   * Determine if a date is in the past
   */
  isPastDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  },
  
  /**
   * Validate a date and ensure day of week is correct
   * @param {Date} date - The date to validate
   * @returns {Object} - Validated date information
   */
  validateDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error("Invalid date passed to validateDate:", date);
      return {
        isValid: false,
        error: "Invalid Date"
      };
    }
    
    // Get the raw day of week from the Date object (most reliable)
    const dayOfWeek = date.getDay(); // 0-6
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dayOfWeek];
    
    // Get other date components
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[month];
    const day = date.getDate(); // 1-31
    
    // Format the date in a consistent way
    const formattedDate = `${dayName}, ${monthName} ${day}, ${year}`;
    
    // Return all validated date information
    return {
      isValid: true,
      date: date,
      dayOfWeek: dayOfWeek, // 0-6
      dayName: dayName,
      year: year,
      month: month, // 0-11
      monthName: monthName,
      day: day, // 1-31
      formattedDate: formattedDate
    };
  },
  
  /**
   * Format a date in a human-readable format
   * Always use Eastern Time (Michigan timezone)
   */
  formatDateForDisplay(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return "Invalid Date";
    }
    
    // Format the date in Eastern Time (America/Detroit)
    const options = {
      timeZone: 'America/Detroit',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    // Use Intl formatter to get the date in Eastern Time
    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);
    
    // Get the day of week in Eastern Time for verification
    const etDayOptions = { timeZone: 'America/Detroit', weekday: 'long' };
    const actualDayName = new Intl.DateTimeFormat('en-US', etDayOptions).format(date);
    
    // Log for troubleshooting
    console.log(`formatDateForDisplay: ET date=${formattedDate}, dayName=${actualDayName}`);
    
    return formattedDate;
  }
};