/**
 * Test the old date extraction method to see if it's giving a different result
 */

const dateUtils = require('./holidays/dateUtils');

// Test message
const message = "does Nic work next week Friday?";

// Extract date using the old method
const extractedDate = dateUtils.extractDateFromString(message);

console.log(`Test message: "${message}"`);

if (extractedDate) {
  console.log("Old extraction method result:");
  console.log(`- Raw date: ${extractedDate}`);
  console.log(`- Day of week: ${extractedDate.getDay()} (5=Friday, 6=Saturday)`);
  console.log(`- ISO string: ${extractedDate.toISOString()}`);
  console.log(`- Formatted: ${dateUtils.formatDateForDisplay(extractedDate)}`);
} else {
  console.log("Old extraction method couldn't extract a date.");
}