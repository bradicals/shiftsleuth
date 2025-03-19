/**
 * Test script for "this [past day]" references
 */

const extractDateFromMessage = require('./extract_date');

// Today is Tuesday, March 18, 2025
const referenceDate = new Date(2025, 2, 18);

// Test cases for "this [past day]" references
const messages = [
  "this Monday",    // Should refer to yesterday (Monday, March 17, 2025)
  "this Sunday",    // Should refer to 2 days ago (Sunday, March 16, 2025)
  "this Saturday",  // Should refer to 3 days ago (Saturday, March 15, 2025)
];

console.log("TESTING 'THIS [PAST DAY]' REFERENCES");
console.log(`Reference date: Tuesday, March 18, 2025\n`);

messages.forEach(message => {
  console.log(`Message: "${message}"`);
  
  // Extract date using our function
  const result = extractDateFromMessage(message, referenceDate);
  
  if (result) {
    console.log(`Extracted date: ${result.formattedDate}`);
    
    // Verify if it's a past date
    const isPast = result.date < referenceDate;
    console.log(`Is past date: ${isPast ? "YES" : "NO"}\n`);
  } else {
    console.log(`No date extracted\n`);
  }
});