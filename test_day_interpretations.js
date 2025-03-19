/**
 * Test script to verify date interpretation logic
 * This script tests how different day references are interpreted
 */

const extractDateFromMessage = require('./extract_date');

// Set a fixed reference date for the test
const referenceDate = new Date(2025, 2, 18); // Tuesday, March 18, 2025

// Test cases that compare different date interpretations
const testCases = [
  // Simple day references vs qualified references
  { 
    label: "Simple day vs This day vs Next day",
    tests: [
      "Friday",              // Should be this Friday (Mar 21)
      "this Friday",         // Should be this Friday (Mar 21)
      "next Friday",         // Should be next Friday (Mar 28)
      "next week Friday"     // Should be next week's Friday (Mar 28)
    ]
  },
  {
    label: "Monday interpretations",
    tests: [
      "Monday",              // Should be next Monday (Mar 24)
      "this Monday",         // Should be this Monday (Mar 17 - in the past, so next Mar 24)
      "next Monday",         // Should be next Monday (Mar 31)
      "next week Monday"     // Should be next week's Monday (Mar 24)
    ]
  },
  {
    label: "Tuesday (today) interpretations",
    tests: [
      "Tuesday",             // Should be next Tuesday (Mar 25)
      "this Tuesday",        // Should be today (Mar 18)
      "next Tuesday",        // Should be next Tuesday (Apr 1)
      "next week Tuesday"    // Should be next week's Tuesday (Mar 25)
    ]
  },
  {
    label: "Specific context examples",
    tests: [
      "does Nic work next week Friday?",     // Should be next week's Friday (Mar 28)
      "is Nic working on Friday?",           // Should be this Friday (Mar 21)
      "can Nic meet next Friday?",           // Should be next Friday (Mar 28)
      "next week's Friday"                   // Should be next week's Friday (Mar 28)
    ]
  }
];

// Run the tests
console.log("DATE INTERPRETATION TEST");
console.log(`Reference date: Tuesday, March 18, 2025\n`);

testCases.forEach(group => {
  console.log(`Testing: ${group.label}`);
  console.log("----------------------------------------");
  
  group.tests.forEach(text => {
    const result = extractDateFromMessage(text, referenceDate);
    
    if (result) {
      console.log(`"${text}" → ${result.formattedDate}`);
    } else {
      console.log(`"${text}" → No date extracted`);
    }
  });
  
  console.log("\n");
});