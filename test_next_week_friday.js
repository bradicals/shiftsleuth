/**
 * Specific test for the "next week Friday" issue
 */

const extractDateFromMessage = require('./extract_date');

// Set up a reference date (today) as Tuesday, March 18, 2025
const today = new Date(2025, 2, 18); // Month is 0-indexed in JavaScript

// Test case
const message = "does Nic work next week Friday?";

// Process the message
console.log(`Test message: "${message}"`);
console.log(`Today's date: ${today.toDateString()}\n`);

const result = extractDateFromMessage(message, today);

if (result) {
  console.log('Extracted date details:');
  console.log(`- Day of week: ${result.dayOfWeek}`);
  console.log(`- Date: ${result.date.toISOString()}`);
  console.log(`- Formatted date: ${result.formattedDate}`);
  console.log(`- Working: ${result.isWorking ? "YES" : "NO"}`);
  
  // Calculate day difference for verification
  const dayDiff = Math.round((result.date - today) / (24 * 60 * 60 * 1000));
  console.log(`- Days from today: ${dayDiff}`);
  
  // Day of week verification
  const dayOfWeek = result.date.getDay();
  console.log(`- Day of week index: ${dayOfWeek} (0=Sunday, 5=Friday, 6=Saturday)`);
} else {
  console.log('No date could be extracted from the message.');
}