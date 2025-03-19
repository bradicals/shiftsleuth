// Test script to verify future tense responses
const config = require('./config');
const responses = require('./holidays/responses');
const dateUtils = require('./holidays/dateUtils');
const holidays = require('./holidays/us_holidays');

// Mock the message object
const mockMessage = {
  react: (emoji) => console.log(`Reacted with: ${emoji}`),
  reply: (text) => console.log(`Reply: ${text}`)
};

// Copy of the updated function from index.js
function handleDateSpecificWorkInquiry(message, dateObj) {
  console.log(`Testing date: ${dateObj.toDateString()}`);
  
  // If the date couldn't be parsed
  if (!dateObj) {
    const response = responses.getRandomResponse(responses.dateResponses.invalidDate);
    message.react(config.getRandomEmoji('confused'));
    return message.reply(response);
  }
  
  // Format to YYYY-MM-DD for checking against our schedule
  const dateStr = dateUtils.formatDate(dateObj);
  console.log(`Formatted date: ${dateStr}`);
  
  // Check if the date is in the past
  if (dateUtils.isPastDate(dateObj)) {
    const response = responses.getRandomResponse(responses.dateResponses.askingAboutPast);
    message.react(config.getRandomEmoji('confused'));
    return message.reply(response);
  }
  
  // Get the year from the date
  const year = dateObj.getFullYear();
  
  // Check if the date is beyond our schedule (e.g., 2026 and later)
  if (year > 2025) {
    const response = responses.getRandomResponse(responses.dateResponses.askingAboutFutureBeyondSchedule);
    message.react(config.getRandomEmoji('confused'));
    return message.reply(response);
  }
  
  // Check if the date is a holiday
  const holiday = holidays.isHoliday(dateStr);
  console.log(`Is holiday: ${holiday ? holiday.name : 'No'}`);
  
  // Check if Nic is working on this date
  const isWorking = config.isWorkingDate(dateStr);
  console.log(`Is working date: ${isWorking}`);
  
  // Format the date for display
  const formattedDate = dateUtils.formatDateForDisplay(dateObj);
  
  // Check if the date is today - in our test, we'll use a fixed date
  // In the real app, this would be: const today = new Date();
  const today = new Date('2025-03-18'); // Use today's date from the environment
  const isToday = today.toDateString() === dateObj.toDateString();
  console.log(`Is today: ${isToday}`);
  
  // If it's a holiday, give a special response about the holiday
  if (holiday) {
    const responseArray = isWorking 
      ? (isToday ? responses.holidayWorking : responses.futureHolidayWorking)
      : (isToday ? responses.holidayNotWorking : responses.futureHolidayNotWorking);
    
    console.log(`Using response array: ${isToday ? 'present' : 'future'} holiday ${isWorking ? 'working' : 'not working'}`);
    const responseTemplate = responses.getRandomResponse(responseArray);
    
    // Replace placeholders with actual values
    const response = responseTemplate
      .replace('{holiday}', holiday.name)
      .replace('{emoji}', holiday.emoji);
    
    // React with the holiday emoji
    message.react(holiday.emoji);
    
    return message.reply(response);
  }
  
  // Regular work day response - use future tense for future dates
  const emoji = isWorking 
    ? config.getRandomEmoji('working') 
    : config.getRandomEmoji('notWorking');
  
  const responseArray = isWorking
    ? (isToday ? responses.workingResponses : responses.futureWorkingResponses)
    : (isToday ? responses.notWorkingResponses : responses.futureNotWorkingResponses);
  
  console.log(`Using response array: ${isToday ? 'present' : 'future'} ${isWorking ? 'working' : 'not working'}`);
  const response = responses.getRandomResponse(responseArray);
  
  // Add a prefix with the date
  const datePrefix = `On ${formattedDate}: `;
  
  // React with emoji
  message.react(emoji);
  
  // Reply with the response
  message.reply(datePrefix + response);
}

// Test with different dates
console.log("=============== TODAY ===============");
handleDateSpecificWorkInquiry(mockMessage, new Date());

console.log("\n=============== FUTURE DATE (03/18/2025) - NOT WORKING ===============");
const march18 = dateUtils.extractDateFromString("03/18/2025");
handleDateSpecificWorkInquiry(mockMessage, march18);

console.log("\n=============== FUTURE DATE (03/19/2025) - WORKING ===============");
const march19 = dateUtils.extractDateFromString("03/19/2025");
handleDateSpecificWorkInquiry(mockMessage, march19);

console.log("\n=============== DISTANT FUTURE DATE (12/25/2025) - HOLIDAY ===============");
const christmas = dateUtils.extractDateFromString("12/25/2025");
handleDateSpecificWorkInquiry(mockMessage, christmas);