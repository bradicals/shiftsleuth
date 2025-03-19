// Test script to debug isWorkQuestion function and date extraction
const config = require('./config');
const dateUtils = require('./holidays/dateUtils');

function isWorkQuestion(content) {
  const containsPersonName = content.includes(config.personName.toLowerCase());
  const containsWork = content.includes("work");
  const containsQuestionMark = content.includes("?");
  
  // More specific work phrases
  if (content.includes(`${config.personName.toLowerCase()} work`) ||
      content.includes(`${config.personName.toLowerCase()} at work`) ||
      content.includes(`is ${config.personName.toLowerCase()} working`)) {
    return true;
  }
  
  // Check for tomorrow work queries
  if ((content.includes("tomorrow") && containsPersonName) ||
      (content.includes("tomorrow") && containsWork)) {
    return true;
  }
  
  // If it has both person's name and work, or just person's name with a question mark
  if ((containsPersonName && containsWork) || 
      (containsPersonName && containsQuestionMark)) {
    return true;
  }
  
  return false;
}

function testQuery(query) {
  console.log(`Testing query: "${query}"`);
  
  const lowercaseQuery = query.toLowerCase();
  
  // Check if work question  
  const workQuestion = isWorkQuestion(lowercaseQuery);
  console.log('Is work question:', workQuestion);
  
  // Try to extract a date from the message
  const extractedDate = dateUtils.extractDateFromString(lowercaseQuery);
  console.log('Extracted date:', extractedDate);
  
  // Format the date if found
  if (extractedDate) {
    const dateStr = dateUtils.formatDate(extractedDate);
    console.log('Formatted date:', dateStr);
    console.log('Is working date:', config.isWorkingDate(dateStr));
  }
  
  console.log('-'.repeat(50));
}

testQuery('is Nic working tonight? (03/18/2025)');
testQuery('is Nic working tonight?');
testQuery('is Nic working on March 18th, 2025?');