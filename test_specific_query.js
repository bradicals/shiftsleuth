/**
 * Test for the exact problematic query
 */

const extractDateFromMessage = require('./extract_date');

// Set up a reference date
const today = new Date(2025, 2, 18); // March 18, 2025 (Tuesday)

// The exact problematic message
const message = "Two weeks from today, is nic working?";

console.log(`Message: "${message}"`);

const result = extractDateFromMessage(message, today);

if (result) {
  console.log(`Extracted date: ${result.formattedDate}`);
  console.log(`Working status: ${result.isWorking ? "Working" : "Not working"}`);
  
  // Calculate days from today
  const dayDiff = Math.round((result.date - today) / (24 * 60 * 60 * 1000));
  console.log(`Days from today: ${dayDiff}`);
} else {
  console.log("No date could be extracted from the message.");
}