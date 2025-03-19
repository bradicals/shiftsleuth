/**
 * Simulation of how the bot processes messages
 * This script replicates the exact flow used in index.js
 */

const dateUtils = require('./holidays/dateUtils');
const config = require('./config');
const extractDateFromMessage = require('./extract_date');

// Simulated message content
const content = "does Nic work next week Friday?";

// Current date (for testing purposes)
const today = new Date(2025, 2, 18); // March 18, 2025

console.log(`Simulating bot processing of message: "${content}"`);
console.log(`Today's date: ${today.toDateString()}\n`);

// Step 1: Extract date using our advanced method
console.log("Step 1: Extract date using new extractDateFromMessage function");
const dateResult = extractDateFromMessage(content, today);

if (dateResult) {
  console.log(`Date extracted: ${dateResult.formattedDate}`);
  console.log(`Day of week index: ${dateResult.date.getDay()} (5=Friday, 6=Saturday)`);
  console.log(`Is working: ${dateResult.isWorking ? "YES" : "NO"}\n`);
  
  // Step 2: Format date for checking against schedule
  console.log("Step 2: Format date for checking against schedule");
  const dateStr = dateUtils.formatDate(dateResult.date);
  console.log(`Formatted date string: ${dateStr}`);
  
  // Step 3: Check if Nic is working on this date
  console.log("\nStep 3: Check if Nic is working on this date");
  const isWorking = config.isWorkingDate(dateStr);
  console.log(`isWorking result: ${isWorking}`);
  
  // Step 4: Format the date for display
  console.log("\nStep 4: Format the date for display");
  const formattedDate = dateUtils.formatDateForDisplay(dateResult.date);
  console.log(`Formatted display date: ${formattedDate}`);
  
  // Final output
  console.log("\nFinal bot message:");
  console.log(`On ${formattedDate}: ${isWorking ? "Working" : "Not working"}`);
} else {
  // Try the old extraction method
  console.log("New method failed. Trying legacy date extraction method...");
  const extractedDate = dateUtils.extractDateFromString(content);
  
  if (extractedDate) {
    console.log(`Legacy date extracted: ${extractedDate}`);
    
    // Format for checking against schedule
    const dateStr = dateUtils.formatDate(extractedDate);
    console.log(`Formatted date string: ${dateStr}`);
    
    // Check if Nic is working
    const isWorking = config.isWorkingDate(dateStr);
    
    // Format for display
    const formattedDate = dateUtils.formatDateForDisplay(extractedDate);
    
    // Final output
    console.log("\nFinal bot message (using legacy extraction):");
    console.log(`On ${formattedDate}: ${isWorking ? "Working" : "Not working"}`);
  } else {
    console.log("No date could be extracted from the message.");
  }
}