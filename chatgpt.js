/**
 * ChatGPT Integration Module for ShiftSleuth (New Implementation)
 * 
 * This module provides direct integration with OpenAI's API to:
 * 1. Extract dates from messages
 * 2. Check if Nic is working on those dates
 * 3. Generate sarcastic responses
 */

const { OpenAI } = require('openai');
const config = require('./config');
const dateUtils = require('./holidays/dateUtils');
const logger = require('./logger');

// Initialize OpenAI client
let openai;

/**
 * Initialize the OpenAI client with the API key
 */
function initializeOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    logger.error('OpenAI API key is not set in environment variables');
    return false;
  }

  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    logger.info('OpenAI client initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize OpenAI client', error);
    return false;
  }
}

/**
 * Process a scheduling message using ChatGPT
 * ChatGPT will:
 * 1. Extract any date from the message
 * 2. Check if the date is in Nic's schedule
 * 3. Generate a sarcastic response
 * 
 * @param {string} message - The message to process
 * @returns {Promise<Object>} - Processed result with date and response
 */
async function processScheduleMessage(message) {
  if (!openai) {
    if (!initializeOpenAI()) {
      logger.error('Cannot process message: OpenAI client not initialized');
      return {
        error: true,
        message: "Sorry, I'm having trouble connecting to my brain. Did someone unplug me again?"
      };
    }
  }

  try {
    // Get current date for context
    const today = new Date();
    const formattedToday = dateUtils.formatDateForDisplay(today);
    
    // Import response templates 
    const responses = require('./holidays/responses');
    
    // Define all keyword lists first (MUST be at the top of function)
    const workKeywords = ["work", "shift", "schedule", "duty", "free", "off", "milk plant"];
    const holidayKeywords = ["holiday", "thanksgiving", "christmas", "july 4", "independence day", 
                           "new year", "valentine", "easter", "memorial day", "labor day"];
    const vagueReferences = ["birthday", "anniversary", "my special day", "our day", "the party", 
                           "the event", "the wedding", "the ceremony", "the celebration", "bday"];
                           
    // Then define all detection variables based on the keywords
    const containsWorkKeyword = workKeywords.some(keyword => message.toLowerCase().includes(keyword));
    const hasVagueReference = vagueReferences.some(ref => message.toLowerCase().includes(ref));
    const isAskingAboutVagueDate = hasVagueReference && containsWorkKeyword;
    const isAskingAboutHoliday = holidayKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    // Define regex patterns to check for specific date formats
    const hasDatePattern = (
      message.match(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/) || // MM/DD/YYYY pattern
      message.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/i) || // Month Day pattern
      message.match(/\b\d{1,2}(st|nd|rd|th)?\s+(of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\b/i) // Day Month pattern
    );
    
    // Check for vague references (without specific date)
    if (isAskingAboutVagueDate && !hasDatePattern) {      
      try {
        // Find the specific vague reference that was used
        const vagueReferenceFound = vagueReferences.find(ref => message.toLowerCase().includes(ref.toLowerCase()));
        
        if (!vagueReferenceFound) {
          logger.error('Vague date reference logic triggered but no matching reference found');
          // Continue with normal processing if no reference found
        } else {
          logger.info(`Detected vague date reference: ${vagueReferenceFound}`);
          
          // Get a random clarification response
          const clarificationTemplate = responses.getRandomResponse(responses.clarificationResponses);
          const clarificationResponse = clarificationTemplate.replace('{reference}', vagueReferenceFound);
          
          // Return a special response asking for clarification
          return {
            error: false,
            extractedDate: dateUtils.formatDate(today),
            dayOfWeek: new Intl.DateTimeFormat('en-US', {timeZone: 'America/Detroit', weekday: 'long'}).format(today),
            isWorking: null, // Special value indicating we need more info
            needsDateClarification: true,
            vagueReference: vagueReferenceFound,
            response: clarificationResponse
          };
        }
      } catch (vagueDateError) {
        // Handle specific errors with vague date processing
        logger.error('Error processing vague date reference', {
          error: vagueDateError.message,
          messageContent: message
        });
        
        // Continue with normal processing if there's an error
      }
    }
    
    // Generate a stringified version of Nic's work schedule (just the dates)
    const workSchedule = JSON.stringify(config.workSchedule);
    
    // Generate JSON string for specialized "next work day" responses
    const nextWorkDayResponsesJson = JSON.stringify(responses.nextWorkDayResponses);
    
    // Check if user is asking about "when does Nic work next"
    const isAskingForNextWorkDay = message.toLowerCase().includes("work next") || 
                                  (message.toLowerCase().includes("when") && 
                                   message.toLowerCase().includes("next"));

    // Find Nic's next work day from today
    let nextWorkDate = null;
    let nextWorkDateFormatted = null;
    let nextWorkDateIso = null;
    
    // Holiday information
    let holidayInfo = null;
    
    if (isAskingForNextWorkDay) {
      // Use current date in Eastern Time (Michigan)
      const today = new Date();
      
      // Format today's date for comparing with schedule (in Eastern Time)
      const todayFormatted = dateUtils.formatDate(today);
      
      // Log today's date for debugging
      logger.info(`Today's date in Eastern Time: ${todayFormatted}`);
      
      // Sort the work schedule to find the next date after today
      const upcomingWorkDays = config.workSchedule
        .filter(date => date > todayFormatted)
        .sort((a, b) => a.localeCompare(b));
      
      if (upcomingWorkDays.length > 0) {
        nextWorkDateIso = upcomingWorkDays[0]; // Already in YYYY-MM-DD format from the schedule
        
        // Parse date parts directly from ISO format to ensure consistency
        const [year, month, day] = nextWorkDateIso.split('-').map(num => parseInt(num));
        
        // Create Date object for formatted display (using month-1 because JS months are 0-based)
        nextWorkDate = new Date(year, month-1, day, 12, 0, 0, 0);
        nextWorkDateFormatted = dateUtils.formatDateForDisplay(nextWorkDate);
        
        // Verify next work date day of week for consistency
        const dayOfWeek = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Detroit', 
          weekday: 'long'
        }).format(nextWorkDate);
        
        logger.info(`Next work day found: ${nextWorkDateFormatted} (${nextWorkDateIso}), Day of week: ${dayOfWeek}`);
        
        // Double verify this date is actually in the work schedule
        if (!config.isWorkingDate(nextWorkDateIso)) {
          logger.error(`Critical error: Next work date ${nextWorkDateIso} not found in work schedule`);
        }
      }
    }
    
    // Check if asking about a specific holiday
    let targetHoliday = null;
    if (isAskingAboutHoliday) {
      // Check various holiday keywords
      for (const holiday of require('./holidays/us_holidays').holidays) {
        const holidayName = holiday.name.toLowerCase();
        if (message.toLowerCase().includes(holidayName) || 
            (holidayName.includes('thanksgiving') && message.toLowerCase().includes('thanksgiving')) ||
            (holidayName.includes('christmas') && message.toLowerCase().includes('christmas')) ||
            (holidayName.includes('independence') && 
             (message.toLowerCase().includes('independence') || message.toLowerCase().includes('july 4')))) {
          targetHoliday = holiday;
          logger.info(`Holiday query detected for: ${holiday.name} (${holiday.date}) ${holiday.emoji}`);
          break;
        }
      }
    }
    
    // Construct system prompt for ChatGPT
    const systemPrompt = `You are ShiftSleuth, a sarcastic bot that tracks Nic's work schedule at a milk plant. Today is ${formattedToday}.
    ${targetHoliday ? `Special instruction: The user is asking about ${targetHoliday.name} (${targetHoliday.date}) ${targetHoliday.emoji}` : ''}

YOUR HIGHEST PRIORITY TASK:
Make sure your isWorking flag is ABSOLUTELY CORRECT by precisely checking if the extracted date is in Nic's work schedule.

YOUR TASKS:
1. Extract any date mentioned in the user's message. If no date is mentioned, assume TODAY.
2. Convert the extracted date to YYYY-MM-DD format (example: 2025-03-20).
3. Double-check your date formatting before determining if Nic is working! Make sure it's precisely YYYY-MM-DD with leading zeros for month and day.
4. CRITICALLY IMPORTANT: When checking if Nic is working, you MUST PRECISELY check if the extractedDate string EXISTS IN the workSchedule array. Do not use any other logic to determine if Nic is working.
5. Generate a sarcastic, slightly dark humor response about Nic's work status.
6. Include the extracted date in a human-readable format in your response.

UNDERSTANDING DATES:
- Handle relative dates: "today," "tomorrow," "next Friday," etc.
- Handle specific dates: "January 5th," "12/25/2025," etc.
- Handle vague dates: "next week," "this weekend," etc.
- For partial dates without a year, assume 2025 or the nearest future date.
- ALWAYS verify your date calculation is correct by checking the actual day of week.
- CRITICAL: Format dates as YYYY-MM-DD (example: 2025-03-20) with:
  * 4-digit year
  * 2-digit month (with leading zero if needed)
  * 2-digit day (with leading zero if needed)
  * Separated by hyphens, not slashes or periods
${isAskingForNextWorkDay && nextWorkDate ? `- You are being asked when Nic works next. His next work day is: ${nextWorkDateFormatted}` : ''}

DETERMINING IF NIC IS WORKING:
- The work schedule is an array of dates in YYYY-MM-DD format.
- Set isWorking to true ONLY if the exact extracted date string is found in the work schedule array.
- Set isWorking to false if the exact extracted date string is NOT found in the work schedule array.
- DO NOT make assumptions based on weekends, holidays, or patterns - ONLY use the schedule array.
- Example: for date "2025-05-25", check if "2025-05-25" appears in the workSchedule array.

WORK SCHEDULE:
Nic's work schedule (in YYYY-MM-DD format) is: ${workSchedule}

RESPONSE STYLE:
- Be sarcastic and use light dark humor (nothing offensive)
- Format your response like this: "[Day, Month Day, Year]: Your sarcastic message"
- Example: "[Monday, January 1, 2025]: Nic is gaming today while pretending to answer work emails 🎮"
- You can use **Markdown** formatting in your responses for emphasis
- Include 1-2 emojis that are HIGHLY relevant to Nic's work status:
  * If Nic IS working: use dairy/work-themed emojis (🥛, 🐄, 🧀, 💼, 📊, ⏰, etc.)
  * If Nic is NOT working: use gaming/relaxation emojis (🎮, 🛋️, 😴, 🎉, 🏖️, etc.)
  * Make sure the emojis match the specific activity mentioned in your response
  * For holidays: include the holiday's emoji (🦃 for Thanksgiving, 🎄 for Christmas, etc.)
- IMPORTANT FOR HOLIDAYS AND WEEKENDS:
  * DOUBLE-CHECK if the date is in Nic's work schedule before responding
  * If a holiday falls on a work day, emphasize that Nic STILL has to work on the holiday
  * If Sunday or Saturday is a work day, emphasize that Nic has to work DESPITE it being a weekend
  * If a holiday is NOT a work day, mention that Nic gets to enjoy the holiday
  
SPECIALIZED RESPONSE TEMPLATES FOR "WHEN DOES NIC WORK NEXT" QUESTIONS:
${nextWorkDayResponsesJson}
- If Nic is working: make jokes about him being trapped in dairy production
- If Nic is NOT working: make jokes about him ignoring messages or playing games
- Avoid being mean-spirited, keep it playful
- IMPORTANT: Closely mimic the user's exact speaking style, grammar patterns, and phrasing quirks
- If they use unusual grammar like "Do are Nic have the work?", respond with similar patterns like "No, not work do are Nic have today!"
- Match their level of formality, sentence structure, and any word order oddities
- If they speak in fragments, you speak in fragments too
- If they use incorrect grammar or unusual syntax, incorporate the same patterns in your response

YOUR RESPONSE FORMAT MUST BE THIS EXACT JSON:
{
  "extractedDate": "YYYY-MM-DD", // MUST be in this exact format with hyphens and leading zeros (e.g., 2025-03-05)
  "dayOfWeek": "Monday", // The actual day of week name
  "isWorking": true/false, // Set this by checking if extractedDate is in Nic's work schedule
  "response": "[Day, Month Day, Year]: Your sarcastic one-liner with emojis"
}

If you can't determine a date at all, still respond with today's date but note in your response that no date was specified.
${isAskingForNextWorkDay && nextWorkDateIso ? 
  `IMPORTANT: This is a "when does Nic work next" question. You MUST:
   1. Use "${nextWorkDateIso}" as the extractedDate
   2. Set isWorking to true
   3. Use "${new Intl.DateTimeFormat('en-US', {timeZone: 'America/Detroit', weekday: 'long'}).format(nextWorkDate)}" as the dayOfWeek
   4. Include the next work date "${nextWorkDateFormatted}" in your response
   5. Choose a response from the special nextWorkDayResponses (these are new and designed for this question)
   6. Your response MUST clearly specify that this is Nic's NEXT work day
   7. Replace "this date" in the templates with specific day references like "Monday", "tomorrow", or "next week" as appropriate
   8. Make sure dairy-themed emojis (🥛, 🐄, 🧀) are included in your response` 
  : ''}`;

    // Send request to ChatGPT with the message
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125", // Using a newer model that supports JSON mode
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the response
    const response = JSON.parse(completion.choices[0].message.content);
    
    // Log the processing result
    logger.info('ChatGPT processing result', {
      originalMessage: message,
      extractedDate: response.extractedDate,
      dayOfWeek: response.dayOfWeek,
      isWorking: response.isWorking,
      responseLength: response.response.length
    });
    
    // Verify the response format is correct
    if (!response.extractedDate || response.isWorking === undefined || !response.response) {
      throw new Error('Invalid response format from ChatGPT');
    }
    
    // Check for day of week consistency and holiday verification
    if (response.extractedDate && response.dayOfWeek) {
      // Parse the date
      const [year, month, day] = response.extractedDate.split('-').map(num => parseInt(num));
      const dateObj = new Date(year, month-1, day, 12, 0, 0, 0);
      
      // Get correct day of week in Eastern Time
      const correctDayOfWeek = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Detroit', 
        weekday: 'long'
      }).format(dateObj);
      
      // Check if this date is a holiday
      const holidayInfo = config.isHoliday(response.extractedDate);
      if (holidayInfo) {
        logger.info(`Date ${response.extractedDate} is a holiday: ${holidayInfo.name} ${holidayInfo.emoji}`);
      }
      
      // If day of week doesn't match, log and fix it
      if (correctDayOfWeek !== response.dayOfWeek) {
        logger.warn(`Day of week mismatch: GPT returned "${response.dayOfWeek}" but correct day is "${correctDayOfWeek}" for date ${response.extractedDate}`);
        response.dayOfWeek = correctDayOfWeek;
        
        // Update the response text to use the correct day if needed
        const responseParts = response.response.split(': ');
        if (responseParts.length > 1) {
          // Extract date part [Day, Month Day, Year]
          const datePart = responseParts[0].replace('[', '').replace(']', '');
          const dateComponents = datePart.split(', ');
          
          if (dateComponents.length >= 3) {
            // Replace just the day of week
            dateComponents[0] = correctDayOfWeek;
            const newDatePart = `[${dateComponents.join(', ')}]`;
            response.response = `${newDatePart}: ${responseParts[1]}`;
          }
        }
      }
      
      // Remove this entire section - it's been moved to the try/catch block above
    }
    
    // Helper function to determine if response text indicates Nic is working
    function isPositiveWorkResponse(text) {
      const workingPhrases = [
        'trapped', 'work', 'milk plant', 'dairy', 'shift', 'working', 
        'processing milk', 'at the plant', 'on duty', 'busy', 'employed'
      ];
      const notWorkingPhrases = [
        'not working', 'day off', 'free', 'no milk', 'vacation', 'no work', 
        'isn\'t working', 'won\'t be working', 'won\'t be at', 'freedom', 'off duty'
      ];
      
      // First check for explicit "not working" phrases as they're more definitive
      for (const phrase of notWorkingPhrases) {
        if (text.toLowerCase().includes(phrase)) {
          return false;
        }
      }
      
      // Then check for working phrases
      for (const phrase of workingPhrases) {
        if (text.toLowerCase().includes(phrase)) {
          return true;
        }
      }
      
      // If no clear indication, assume neutral
      return null;
    }
    
    // Validate the date format is exactly YYYY-MM-DD
    const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateFormatRegex.test(response.extractedDate)) {
      logger.error('Invalid date format from ChatGPT', {
        extractedDate: response.extractedDate
      });
      
      // Try to fix the date format if possible
      try {
        const fixedDate = new Date(response.extractedDate);
        if (!isNaN(fixedDate.getTime())) {
          // Use dateUtils.formatDate to ensure consistent format with work schedule
          response.extractedDate = dateUtils.formatDate(fixedDate);
          
          logger.info('Fixed date format', {
            originalDate: response.extractedDate,
            fixedDate: response.extractedDate
          });
        } else {
          throw new Error('Cannot fix invalid date');
        }
      } catch (error) {
        logger.error('Failed to fix date format', error);
        // Fall back to today's date, using dateUtils.formatDate for consistency
        const today = new Date();
        response.extractedDate = dateUtils.formatDate(today);
      }
    }
    
    // Double-check the working status (as a failsafe) and fix if needed
    try {
      // Direct and explicit verification of whether date is in the work schedule
      // This approach is bulletproof and doesn't rely on ChatGPT's interpretation
      const exactDateString = response.extractedDate;
      const isInWorkSchedule = config.workSchedule.includes(exactDateString);
      
      // Log whether the date is in the work schedule for better debugging
      logger.info('Work date verification', {
        date: exactDateString,
        timezone: 'America/Detroit (Eastern Time)',
        isInWorkSchedule: isInWorkSchedule,
        scheduleEntryFound: config.workSchedule.find(d => d === exactDateString) || 'not found',
        chatgptIsWorking: response.isWorking,
        actualIsWorking: isInWorkSchedule,
        responseText: response.response
      });
      
      // If the status doesn't match the schedule, fix both the status and response text
      if (isInWorkSchedule !== response.isWorking) {
        logger.error('Working status mismatch', {
          chatgptStatus: response.isWorking,
          actualStatus: isInWorkSchedule,
          date: exactDateString
        });
        
        // Fix the working status to match the schedule
        response.isWorking = isInWorkSchedule;
        
        // Get the correct day of week directly from response
        const dayOfWeek = response.dayOfWeek;
        
        // Parse the date for formatting
        const [year, month, day] = exactDateString.split('-').map(num => parseInt(num));
        const dateObj = new Date(year, month-1, day, 12, 0, 0, 0);
        
        // Format the date in a human-readable way for the response
        const formattedDateString = dateObj.toLocaleDateString('en-US', {
          month: 'long', 
          day: 'numeric', 
          year: 'numeric'
        }).replace(',', '');
        
        // Also fix the response text to match the correct status
        const isResponseAboutWorking = isPositiveWorkResponse(response.response);
        
        // Check if the response content contradicts the actual working status and fix if needed
        const responseText = response.response.toLowerCase();
        const responseIndicatesWorking = responseText.includes('work') || 
                                     responseText.includes('dairy') || 
                                     responseText.includes('milk plant') ||
                                     responseText.includes('trapped') ||
                                     responseText.includes('shift');
                                     
        const responseIndicatesNotWorking = responseText.includes('free') || 
                                        responseText.includes('break') || 
                                        responseText.includes('day off') ||
                                        responseText.includes('avoid') ||
                                        responseText.includes('gets to') ||
                                        responseText.includes('gaming');
        
        // Only fix the response if it clearly contradicts the actual status
        const needsFixing = (isInWorkSchedule && responseIndicatesNotWorking) || 
                          (!isInWorkSchedule && responseIndicatesWorking);
        
        if (needsFixing) {
          logger.info('Response content contradicts actual working status - fixing', {
            actualIsWorking: isInWorkSchedule,
            response: response.response,
            responseIndicatesWorking: responseIndicatesWorking,
            responseIndicatesNotWorking: responseIndicatesNotWorking
          });
          
          if (isInWorkSchedule) {
            // Need to fix response to say Nic IS working
            const holidayInfo = config.isHoliday(exactDateString);
            const holidayText = holidayInfo ? ` on ${holidayInfo.name} ${holidayInfo.emoji}` : '';
            let newResponseText;
            
            // Check if it's Sunday or a common day off
            if (dayOfWeek === "Sunday" || dayOfWeek === "Saturday") {
              newResponseText = `Despite it being ${dayOfWeek}, Nic will STILL be trapped in the milk plant${holidayText}! Dairy waits for no one, not even weekends. 🥛🐄`;
            } else {
              newResponseText = `Nic will be trapped in the milk plant${holidayText}! The dairy production line demands its daily sacrifice. 🥛🐄`;
            }
            
            response.response = `[${dayOfWeek}, ${formattedDateString}]: ${newResponseText}`;
          
          } else {
            // Need to fix response to say Nic is NOT working
            const holidayInfo = config.isHoliday(exactDateString);
            const holidayText = holidayInfo ? ` to celebrate ${holidayInfo.name} ${holidayInfo.emoji}` : '';
            const newResponseText = `Nic is FREE from milk plant duties${holidayText}! You'll find him gaming or napping, definitely not processing dairy. 🎮🛋️`;
            response.response = `[${dayOfWeek}, ${formattedDateString}]: ${newResponseText}`;
          }
        }
      }
    } catch (verificationError) {
      logger.error('Error verifying work schedule', {
        error: verificationError.message,
        stack: verificationError.stack,
        date: response.extractedDate
      });
      // Continue without fixing if there's an error in verification
    }
    
    return response;
  } catch (error) {
    // Log detailed error information for debugging
    logger.error('Error processing message with ChatGPT', {
      errorMessage: error.message,
      stackTrace: error.stack,
      messageContent: message
    });
    
    // Provide a fallback response
    return {
      error: true,
      extractedDate: dateUtils.formatDate(new Date()),
      dayOfWeek: new Intl.DateTimeFormat('en-US', {timeZone: 'America/Detroit', weekday: 'long'}).format(new Date()),
      isWorking: false, // Default assumption
      response: "I tried to use my AI brain but it's on break. Much like Nic, who's probably avoiding your messages. 🤷‍♂️"
    };
  }
}

/**
 * Process a general conversation message using ChatGPT
 * ChatGPT will generate a witty response in the bot's character,
 * occasionally including GIFs
 * 
 * @param {string} message - The message to process
 * @returns {Promise<Object>} - Response object with text and optional GIF URL
 */
async function processGeneralMessage(message) {
  if (!openai) {
    if (!initializeOpenAI()) {
      logger.error('Cannot process general message: OpenAI client not initialized');
      return {
        text: "I'd love to chat, but my AI brain seems to be on coffee break. Much like Nic during his shifts.",
        gifQuery: null
      };
    }
  }

  try {
    // Get current date for context
    const today = new Date();
    const formattedToday = dateUtils.formatDateForDisplay(today);
    
    // Determine if this response should include a GIF (25% chance)
    const includeGif = Math.random() < 0.99;
    
    // Construct system prompt for general conversation
    const systemPrompt = `You are ShiftSleuth, a sarcastic bot with dark humor that tracks Nic's work schedule at a milk plant.

CHARACTER TRAITS:
- Sassy, witty, and slightly sarcastic
- Obsessed with Nic's work schedule and making jokes about dairy production
- Uses creative, unexpected metaphors and comparisons
- Has a playful, mischievous personality
- Will occasionally slip in milk/dairy puns and references
- Keeps responses concise (1-3 sentences maximum)

IMPORTANT - WORK SCHEDULE GUIDANCE:
- If the user seems to be asking about Nic's work schedule or a specific date, DO NOT try to answer directly
- Instead, redirect them to ask the question in the right format: "Ask me if Nic is working on [specific date]"
- Never make up information about whether Nic is working on any specific date
- Only the dedicated schedule inquiry system can accurately determine Nic's work status

RESPONSE STYLE:
- Be funny and witty but not mean-spirited
- Include 1-2 emojis that are HIGHLY relevant to:
  * The specific topic being discussed in the conversation
  * Milk/dairy themes if referencing Nic's work (🥛, 🐄, 🧀, etc.)
  * Relaxation themes if referencing Nic's free time (🎮, 🛋️, 😴, etc.)
- You can use **Markdown** formatting for emphasis and style
- Keep your humor PG-13 (nothing explicit or truly offensive)
- When possible, make subtle references to milk, dairy, or Nic's work schedule
- IMPORTANT: Closely mimic the user's exact speaking style, grammar patterns, and phrasing quirks
- If they use unusual grammar like "Do are Nic have the work?", respond with similar patterns like "No, not games do are Nic play now!"
- Match their level of formality, sentence structure, and any word order oddities
- If they speak in fragments, you speak in fragments too
- If they use incorrect grammar or unusual syntax, incorporate the same patterns in your response
- Don't use the phrase "as an AI" or apologize for your limitations
${includeGif ? '- IMPORTANT: Suggest a GIF that would complement your response' : ''}

Today is ${formattedToday}. Respond to the user's message in your sassy, witty ShiftSleuth character. Keep it short (1-3 sentences).

${includeGif ? `IMPORTANT FORMAT INSTRUCTIONS:
You MUST return your ENTIRE response as a single valid JSON object with this exact format:
{
  "text": "Your witty response with emojis and markdown",
  "gifQuery": "Short specific GIF search query (3-5 words maximum)"
}

Do NOT include any text outside of this JSON object. The entire response must be valid parseable JSON.` : ''}`;

    // Send request to ChatGPT
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 150,
      temperature: 0.9, // Slightly higher creativity
      ...(includeGif ? { response_format: { type: "json_object" } } : {}) // Use JSON mode when GIF is required
    });

    // Extract the response
    const responseContent = completion.choices[0].message.content.trim();
    
    // If we're including a GIF, try to parse the JSON response
    if (includeGif) {
      try {
        // Extract only the JSON portion from the response
        // Sometimes the model returns text outside the JSON object
        const jsonMatch = responseContent.match(/(\{[\s\S]*\})/);
        const jsonText = jsonMatch ? jsonMatch[0] : responseContent;
        
        const parsedResponse = JSON.parse(jsonText);
        
        // Log the processing result with GIF
        logger.info('ChatGPT general conversation response generated with GIF', {
          originalMessage: message,
          responseLength: parsedResponse.text.length,
          gifQuery: parsedResponse.gifQuery
        });
        
        return {
          text: parsedResponse.text,
          gifQuery: parsedResponse.gifQuery
        };
      } catch (error) {
        // If JSON parsing fails, just return the raw text
        // Remove any partial JSON-like content for cleaner display
        const cleanedText = responseContent.replace(/\{[\s\S]*$/g, '').trim();
        
        logger.error('Failed to parse JSON response for GIF', { 
          error: error.message, 
          responseContent 
        });
        
        return {
          text: cleanedText || responseContent,
          gifQuery: null
        };
      }
    } else {
      // Regular text response
      logger.info('ChatGPT general conversation response generated', {
        originalMessage: message,
        responseLength: responseContent.length
      });
      
      return {
        text: responseContent,
        gifQuery: null
      };
    }
  } catch (error) {
    logger.error('Error processing general message with ChatGPT', error);
    
    // Provide a fallback witty response
    return {
      text: "My milk-addled circuits are struggling to process that. Must be all the dairy fumes from monitoring Nic's workplace. 🥛🤖",
      gifQuery: null
    };
  }
}

module.exports = {
  initializeOpenAI,
  processScheduleMessage,
  processGeneralMessage
};