// Test script to debug date handling
const config = require('./config');
const responses = require('./holidays/responses');
const dateUtils = require('./holidays/dateUtils');
const holidays = require('./holidays/us_holidays');

function testDateQuery(query) {
  console.log(`Testing query: "${query}"`);
  
  // Extract date from query
  const dateObj = dateUtils.extractDateFromString(query);
  console.log('Extracted date object:', dateObj);
  
  if (!dateObj) {
    console.log('Could not extract date from query');
    return;
  }
  
  // Format to YYYY-MM-DD for checking against our schedule
  const dateStr = dateUtils.formatDate(dateObj);
  console.log('Formatted date string:', dateStr);
  
  // Check if Nic is working on this date
  const isWorking = config.isWorkingDate(dateStr);
  console.log('Is working according to schedule:', isWorking);
  
  // Simulate response generation
  const holiday = holidays.isHoliday(dateStr);
  
  if (holiday) {
    console.log('This date is a holiday:', holiday.name);
    const responseTemplate = isWorking 
      ? responses.getRandomResponse(responses.holidayWorking)
      : responses.getRandomResponse(responses.holidayNotWorking);
    
    const response = responseTemplate
      .replace('{holiday}', holiday.name)
      .replace('{emoji}', holiday.emoji);
    
    console.log('Response:', response);
  } else {
    const response = isWorking
      ? responses.getRandomResponse(responses.workingResponses)
      : responses.getRandomResponse(responses.notWorkingResponses);
    
    console.log('Response type:', isWorking ? 'WORKING' : 'NOT WORKING');
    console.log('Response:', response);
  }
  
  console.log('-'.repeat(50));
}

// Test with the problematic query
testDateQuery('is Nic working tonight? (03/18/2025)');

// Test with a known working date as control
testDateQuery('is Nic working on 03/19/2025?');