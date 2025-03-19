// Test script to verify the holiday date extraction functionality
const config = require('./config');
const dateUtils = require('./holidays/dateUtils');

function testHolidayExtraction(message) {
  console.log(`\nTesting message: "${message}"`);
  
  // Extract date from message
  const extractedDate = dateUtils.extractDateFromString(message);
  
  if (!extractedDate) {
    console.log("No date could be extracted from this message.");
    return;
  }
  
  // Format the date for display
  const formattedDate = dateUtils.formatDateForDisplay(extractedDate);
  console.log(`Extracted date: ${formattedDate}`);
  
  // Convert to YYYY-MM-DD format for checking against schedule
  const dateStr = dateUtils.formatDate(extractedDate);
  
  // Check if Nic is working on this date
  const isWorking = config.isWorkingDate(dateStr);
  console.log(`Is Nic working on ${formattedDate}? ${isWorking ? 'Yes' : 'No'}`);
  
  // Check if it's a holiday
  const holiday = config.isHoliday(dateStr);
  if (holiday) {
    console.log(`Note: This date is ${holiday.name} (${holiday.emoji})`);
  }
  
  console.log("-".repeat(50));
}

// Test various holiday references
console.log("TESTING HOLIDAY REFERENCES");

const holidayMessages = [
  "does Nic work on Christmas?",
  "is Nic working on Easter?",
  "will Nic be free on Thanksgiving?",
  "is Nic working on New Year's?",
  "is Nic working on Halloween?",
  "does Nic work on Valentine's Day?",
  "is Nic working on July 4th?",
  "is Nic working on Memorial Day?",
  "is Nic working on Labor Day?",
  "will Nic be free on St. Patrick's Day?",
  "is Nic working on NYE?"
];

holidayMessages.forEach(testHolidayExtraction);