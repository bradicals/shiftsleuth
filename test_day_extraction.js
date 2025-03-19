// Test script to verify the enhanced date extraction functionality
const config = require('./config');
const dateUtils = require('./holidays/dateUtils');

function testDateExtraction(message) {
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
  // This is just for comprehensive testing
  const holiday = config.isHoliday(dateStr);
  if (holiday) {
    console.log(`Note: This date is ${holiday.name} (${holiday.emoji})`);
  }
  
  console.log("-".repeat(50));
}

// Test various natural language date references
console.log("TESTING DAY OF WEEK REFERENCES");

const testMessages = [
  "does Nic work next Tuesday?",
  "can we meet on Friday?",
  "is Nic working this Wednesday?",
  "will Nic be free on Monday?",
  "does Nic work next week on Thursday?",
  "is Nic working this Sunday?",
  "is Nic working tomorrow?",
  "did Nic work yesterday?",
  "is Nic free today?",
  "is he working the day after tomorrow?",
  "is Nic working on 3/25/2025?",
  "is Nic free on March 30, 2025?",
  "does Nic work on Christmas?"
];

testMessages.forEach(testDateExtraction);