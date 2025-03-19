// Debug script for holiday date extraction
const dateUtils = require('./holidays/dateUtils');

// Test specific holiday strings
const holidayStrings = [
  "Christmas",
  "Halloween",
  "July 4th",
  "Independence Day",
  "Valentine's Day",
  "New Year's Eve",
  "NYE",
  "St. Patrick's Day",
  "Thanksgiving"
];

console.log("DETAILED HOLIDAY DATE DEBUG");
console.log("===========================");

for (const holidayStr of holidayStrings) {
  console.log(`\nTesting holiday: "${holidayStr}"`);
  
  const extractedDate = dateUtils.findHolidayInText(holidayStr);
  
  if (extractedDate) {
    console.log(`✅ Extracted date: ${extractedDate.toDateString()}`);
    console.log(`   ISO format: ${extractedDate.toISOString()}`);
    console.log(`   Formatted: ${dateUtils.formatDate(extractedDate)}`);
    console.log(`   Display format: ${dateUtils.formatDateForDisplay(extractedDate)}`);
  } else {
    console.log(`❌ Failed to extract date for "${holidayStr}"`);
  }
}