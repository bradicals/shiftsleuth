// US holidays for 2025
module.exports = {
  holidays: [
    { date: '2025-01-01', name: 'New Year\'s Day', emoji: '🎆' },
    { date: '2025-01-20', name: 'Martin Luther King Jr. Day', emoji: '✊🏽' },
    { date: '2025-02-17', name: 'Presidents\' Day', emoji: '🇺🇸' },
    { date: '2025-05-26', name: 'Memorial Day', emoji: '🎖️' },
    { date: '2025-06-19', name: 'Juneteenth', emoji: '✊🏿' },
    { date: '2025-07-04', name: 'Independence Day', emoji: '🎇' },
    { date: '2025-09-01', name: 'Labor Day', emoji: '👷' },
    { date: '2025-10-13', name: 'Columbus Day', emoji: '🧭' },
    { date: '2025-11-11', name: 'Veterans Day', emoji: '🎖️' },
    { date: '2025-11-27', name: 'Thanksgiving Day', emoji: '🦃' },
    { date: '2025-12-25', name: 'Christmas Day', emoji: '🎄' },
    
    // Additional fun holidays
    { date: '2025-02-14', name: 'Valentine\'s Day', emoji: '❤️' },
    { date: '2025-03-17', name: 'St. Patrick\'s Day', emoji: '☘️' },
    { date: '2025-04-01', name: 'April Fools\' Day', emoji: '🃏' },
    { date: '2025-05-05', name: 'Cinco de Mayo', emoji: '🌮' },
    { date: '2025-10-31', name: 'Halloween', emoji: '👻' },
    { date: '2025-12-31', name: 'New Year\'s Eve', emoji: '🥂' }
  ],
  
  // Function to check if a date is a holiday
  isHoliday(dateStr) {
    return this.holidays.find(holiday => holiday.date === dateStr);
  }
};