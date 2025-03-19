// Test script to debug the entire handleDateSpecificWorkInquiry flow
const config = require('./config');
const responses = require('./holidays/responses');
const dateUtils = require('./holidays/dateUtils');
const holidays = require('./holidays/us_holidays');

// Mock message object
const mockMessage = {
  react: (emoji) => console.log(`Reacted with: ${emoji}`),
  reply: (text) => console.log(`Reply: ${text}`)
};

// Simulate handleDateSpecificWorkInquiry function
function handleDateSpecificWorkInquiry(message, dateObj) {
  console.log('Function called with date:', dateObj);
  
  // If the date couldn't be parsed
  if (!dateObj) {
    const response = responses.getRandomResponse(responses.dateResponses.invalidDate);
    message.react(config.getRandomEmoji('confused'));
    return message.reply(response);
  }
  
  // Format to YYYY-MM-DD for checking against our schedule
  const dateStr = dateUtils.formatDate(dateObj);
  console.log('Formatted date for checking:', dateStr);
  
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
  console.log('Is holiday:', holiday ? holiday.name : 'No');
  
  // Check if Nic is working on this date
  const isWorking = config.isWorkingDate(dateStr);
  console.log('Is working date (config.isWorkingDate):', isWorking);
  console.log('Direct check (includes):', config.workSchedule.includes(dateStr));
  
  // Format the date for display
  const formattedDate = dateUtils.formatDateForDisplay(dateObj);
  
  // If it's a holiday, give a special response about the holiday
  if (holiday) {
    const responseTemplate = isWorking 
      ? responses.getRandomResponse(responses.holidayWorking)
      : responses.getRandomResponse(responses.holidayNotWorking);
    
    // Replace placeholders with actual values
    const response = responseTemplate
      .replace('{holiday}', holiday.name)
      .replace('{emoji}', holiday.emoji);
    
    // React with the holiday emoji
    message.react(holiday.emoji);
    
    return message.reply(response);
  }
  
  // Regular work day response
  const emoji = isWorking 
    ? config.getRandomEmoji('working') 
    : config.getRandomEmoji('notWorking');
  
  const response = isWorking
    ? responses.getRandomResponse(responses.workingResponses)
    : responses.getRandomResponse(responses.notWorkingResponses);
  
  // Add a prefix with the date
  const datePrefix = `On ${formattedDate}: `;
  
  // React with emoji
  message.react(emoji);
  
  // Reply with the response
  message.reply(datePrefix + response);
}

// Test the function with various dates
console.log('TEST CASE 1: March 18, 2025 (should NOT be working)');
const march18 = dateUtils.extractDateFromString('03/18/2025');
handleDateSpecificWorkInquiry(mockMessage, march18);

console.log('\nTEST CASE 2: March 19, 2025 (should be working)');
const march19 = dateUtils.extractDateFromString('03/19/2025');
handleDateSpecificWorkInquiry(mockMessage, march19);