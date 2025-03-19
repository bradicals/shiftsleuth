/**
 * Demo script for the natural language date extraction module
 * 
 * This script shows how to use the extractDateFromMessage function
 * to parse user queries about Nic's work schedule.
 */

const extractDateFromMessage = require('./extract_date');

// Set a fixed reference date for demonstration
const referenceDate = new Date(2025, 2, 18); // March 18, 2025

/**
 * Analyze a message and generate a response about Nic's work schedule
 * @param {string} message - The user's message
 * @returns {string} - The formatted response
 */
function analyzeMessage(message) {
  console.log(`User: "${message}"`);
  
  // Extract date from the message
  const result = extractDateFromMessage(message, referenceDate);
  
  if (!result) {
    return "I couldn't determine a specific date from your message. Try mentioning a day like 'Friday' or a date like 'April 8'.";
  }
  
  // Format the response based on the extracted date
  const holidayInfo = result.isHoliday ? ` (${result.holidayName})` : '';
  
  let response = `I found a date reference: ${result.formattedDate}${holidayInfo}\n`;
  
  if (result.isWorking) {
    response += `Nic IS working at the milk plant on ${result.formattedDate}. 💼`;
  } else {
    response += `Nic is NOT working at the milk plant on ${result.formattedDate}. 🎮`;
  }
  
  return response;
}

// Example user messages
const exampleMessages = [
  "Does Nic work this Friday?",
  "Is Nic at the milk plant next Tuesday?",
  "Will Nic be working tomorrow?",
  "Does Nic have Easter off?",
  "Is Nic working on Christmas?",
  "Can we meet on April 15 or is Nic working?",
  "Does Nic work next week Friday?",
  "Is Nic working next week Monday?",
  "Will Nic be at the milk plant next week Wednesday?"
];

// Process each example message
console.log("NATURAL LANGUAGE DATE EXTRACTION DEMO");
console.log("Today's date: Tuesday, March 18, 2025\n");

exampleMessages.forEach(message => {
  const response = analyzeMessage(message);
  console.log(`Bot: ${response}\n`);
});