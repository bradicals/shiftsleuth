/**
 * Direct test of the specific message that's causing issues
 */

// Import required modules
const dateUtils = require('./holidays/dateUtils');
const extractDateFromMessage = require('./extract_date');

// Set reference date to today
const today = new Date();

// The problematic message
const message = "does Nic work next week Friday?";

console.log(`Message: "${message}"`);
console.log(`Today's date: ${today.toDateString()}\n`);

// Get date using our enhanced extractor
const enhancedResult = extractDateFromMessage(message);
if (enhancedResult) {
  console.log("Enhanced extraction result:");
  console.log(`- Date: ${enhancedResult.date.toDateString()}`);
  console.log(`- Day of week: ${enhancedResult.date.getDay()} (5=Friday, 6=Saturday)`);
  console.log(`- Formatted: ${enhancedResult.formattedDate}\n`);
} else {
  console.log("Enhanced extraction failed\n");
}

// Get date using the old method
const oldResult = dateUtils.extractDateFromString(message);
if (oldResult) {
  console.log("Legacy extraction result:");
  console.log(`- Date: ${oldResult.toDateString()}`);
  console.log(`- Day of week: ${oldResult.getDay()} (5=Friday, 6=Saturday)`);
  console.log(`- Formatted: ${dateUtils.formatDateForDisplay(oldResult)}\n`);
} else {
  console.log("Legacy extraction failed\n");
}

// Try a direct date for the next Friday to see how it's formatted
console.log("Control test with explicit date:");
const nextWeekFriday = new Date();
nextWeekFriday.setDate(nextWeekFriday.getDate() + (5 - nextWeekFriday.getDay() + 7) % 7 + 7);
console.log(`- Date: ${nextWeekFriday.toDateString()}`);
console.log(`- Day of week: ${nextWeekFriday.getDay()} (5=Friday, 6=Saturday)`);
console.log(`- Formatted: ${dateUtils.formatDateForDisplay(nextWeekFriday)}`);

// Check if response is wrong by checking day of week
const wrongDayOfWeek = enhancedResult && enhancedResult.date.getDay() === 6; // Saturday is 6
if (wrongDayOfWeek) {
  console.log("\n⚠️ ERROR: Enhanced extraction returning a SATURDAY instead of a FRIDAY!");
}