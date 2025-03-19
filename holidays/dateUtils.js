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
   */
  formatDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return null;
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
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
    
    // Check for common date phrases
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (/\btoday\b/i.test(text)) {
      return today;
    }
    
    if (/\btomorrow\b/i.test(text) || /\bnext day\b/i.test(text)) {
      return tomorrow;
    }
    
    if (/\byesterday\b/i.test(text) || /\bprevious day\b/i.test(text)) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    }
    
    // Check for day-after-tomorrow and similar phrases
    if (/\bday after tomorrow\b/i.test(text) || /\bin 2 days\b/i.test(text) || /\bin two days\b/i.test(text)) {
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      return dayAfterTomorrow;
    }
    
    // None of the patterns matched
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
   * Format a date in a human-readable format
   */
  formatDateForDisplay(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return "Invalid Date";
    }
    
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    return date.toLocaleDateString('en-US', options);
  }
};