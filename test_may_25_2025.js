/**
 * Test file to verify fix for the May 25, 2025 work schedule issue
 * This test directly checks whether the date is correctly identified as a work day
 */

const config = require('./config');
const dateUtils = require('./holidays/dateUtils');
const chatgpt = require('./chatgpt');

// Initialize the OpenAI client
chatgpt.initializeOpenAI();

// Test function to verify the date is in the work schedule array
function testDateInWorkSchedule(dateStr) {
  console.log(`\nTesting date: ${dateStr}`);
  console.log(`Date exists in work schedule: ${config.workSchedule.includes(dateStr)}`);
  console.log(`config.isWorkingDate result: ${config.isWorkingDate(dateStr)}`);

  // Verify the day of week
  const dateParts = dateStr.split('-').map(part => parseInt(part));
  const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 12, 0, 0, 0);
  const dayOfWeek = dateObj.toLocaleDateString('en-US', { 
    timeZone: 'America/Detroit',
    weekday: 'long' 
  });
  console.log(`Day of week: ${dayOfWeek}`);
  
  const formattedDate = dateUtils.formatDateForDisplay(dateObj);
  console.log(`Formatted date: ${formattedDate}`);
}

// Function to convert responses to a simplified format for easier reading
function simplifyResponse(response) {
  return {
    extractedDate: response.extractedDate,
    dayOfWeek: response.dayOfWeek,
    isWorking: response.isWorking,
    response: response.response
  };
}

// Directly test the date in the work schedule
testDateInWorkSchedule('2025-05-25');

// Now test ChatGPT's response to a query about this date
async function testChatGPTResponse() {
  try {
    // Test a query about May 25, 2025
    const query1 = "Is Nic working on May 25, 2025?";
    console.log(`\nQuery: "${query1}"`);
    const response1 = await chatgpt.processScheduleMessage(query1);
    console.log("Response:", simplifyResponse(response1));
    
    // Test a query about Sunday May 25, 2025
    const query2 = "Is Nic working on Sunday, May 25, 2025?";
    console.log(`\nQuery: "${query2}"`);
    const response2 = await chatgpt.processScheduleMessage(query2);
    console.log("Response:", simplifyResponse(response2));
    
    // Test a query with MM/DD/YYYY format
    const query3 = "Does Nic have to work on 05/25/2025?";
    console.log(`\nQuery: "${query3}"`);
    const response3 = await chatgpt.processScheduleMessage(query3);
    console.log("Response:", simplifyResponse(response3));
    
    // Test another date near it for comparison
    const query4 = "Is Nic working on May 26, 2025?";
    console.log(`\nQuery: "${query4}"`);
    const response4 = await chatgpt.processScheduleMessage(query4);
    console.log("Response:", simplifyResponse(response4));
  } catch (error) {
    console.error("Error testing ChatGPT response:", error);
  }
}

// Run the ChatGPT test
testChatGPTResponse().then(() => {
  console.log("\nTests completed!");
  process.exit(0);
}).catch(error => {
  console.error("Test error:", error);
  process.exit(1);
});