/**
 * Test for "X weeks from today" date expressions
 */

const extractDateFromMessage = require('./extract_date');

// Set up a reference date
const today = new Date(2025, 2, 18); // March 18, 2025 (Tuesday)

// Test cases
const testCases = [
  "Is Nic working two weeks from today?",
  "What about 1 week from today?",
  "Does Nic work 3 weeks from today?",
  "Can we meet 4 weeks from today?"
];

console.log(`Reference date: ${today.toDateString()}\n`);

// Test each case
testCases.forEach(message => {
  console.log(`Message: "${message}"`);
  
  const result = extractDateFromMessage(message, today);
  
  if (result) {
    console.log(`Extracted date: ${result.formattedDate}`);
    
    // Calculate days from today
    const dayDiff = Math.round((result.date - today) / (24 * 60 * 60 * 1000));
    console.log(`Days from today: ${dayDiff}`);
    
    // Verify if it's a multiple of 7 (weeks)
    console.log(`Is multiple of 7: ${dayDiff % 7 === 0 ? "YES" : "NO"}`);
    console.log(`Working: ${result.isWorking ? "YES" : "NO"}\n`);
  } else {
    console.log("No date extracted\n");
  }
});