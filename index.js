/**
 * ShiftSleuth Discord Bot - Main Entry Point
 * A sarcastic bot that tracks Nic's work schedule at the milk plant
 * 
 * This new implementation completely replaces the old date extraction and response
 * logic with a direct integration to ChatGPT, which handles all aspects of:
 * - Date extraction from natural language
 * - Schedule checking
 * - Response generation
 */

require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const fetch = require('node-fetch');
const config = require("./config");
const logger = require("./logger");
const chatgpt = require("./chatgpt");

// Http Server Ping to keep the bot alive
const express = require("express");
const app = express();

// In-memory store for user states
const userStates = new Map();

// Set up a simple route that responds when pinged
app.get("/", (req, res) => {
  res.send(`${config.botName} is stalking ${config.personName}'s work schedule...`);
});

// Start the server
app.listen(process.env.PORT, () => {
  logger.info(`Server listening at http://localhost:${process.env.PORT}`);
});

// Initialize Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// When the client is ready, run this code once
client.once(Events.ClientReady, () => {
  logger.info(`Logged in as ${client.user.tag}`);
  logger.info(`${config.botName} is ready! Tracking schedule for ${config.personName}`);
  
  // Initialize OpenAI client
  chatgpt.initializeOpenAI();
});

/**
 * Fetch a GIF URL from Tenor based on a search query
 * @param {string} searchQuery - The search term for the GIF
 * @returns {Promise<string|null>} - URL of the GIF or null if not found
 */
async function fetchGif(searchQuery) {
  // Check if TENOR_API_KEY is set
  if (!process.env.TENOR_API_KEY) {
    logger.error("TENOR_API_KEY is not set in environment variables");
    return null;
  }
  
  try {
    const apiKey = process.env.TENOR_API_KEY;
    const limit = 1; // Get only 1 result to keep it simple
    
    // URL encode the search query
    const encodedQuery = encodeURIComponent(searchQuery);
    
    // Construct the API URL
    const url = `https://tenor.googleapis.com/v2/search?q=${encodedQuery}&key=${apiKey}&limit=${limit}&contentfilter=medium`;
    
    // Fetch from Tenor API
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Tenor API returned status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if we got any results
    if (data.results && data.results.length > 0) {
      // Return the URL of the first GIF
      return data.results[0].media_formats.gif.url;
    } else {
      logger.warn(`No GIFs found for query: ${searchQuery}`);
      return null;
    }
  } catch (error) {
    logger.error("Error fetching GIF from Tenor", error);
    return null;
  }
}

/**
 * Determine if a message is specifically asking if Nic is working
 * @param {string} message - The message content to analyze
 * @returns {boolean} - True if it's directly asking about Nic's work status
 */
function detectWorkScheduleQuestion(message) {
  // Convert to lowercase for easier matching
  const content = message.toLowerCase();
  
  // Check if it contains Nic's name (required)
  const nicName = config.personName.toLowerCase();
  const containsNicName = content.includes(nicName);
  
  // Start logging for detection
  logger.info(`Detecting if "${content}" is a work schedule question`);
  
  // If it doesn't mention Nic, it's not a work schedule question
  if (!containsNicName) {
    logger.info("Message doesn't contain Nic's name, not a schedule question");
    return false;
  }
  
  // First, check for time references which almost always indicate a schedule question
  const timeReferences = ['today', 'tonight', 'tomorrow', 'next week', 'weekend', 'monday', 'tuesday', 'wednesday', 
                         'thursday', 'friday', 'saturday', 'sunday', 'january', 'february', 'march', 'april', 
                         'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  
  // Check if any basic work keywords are present, regardless of exact phrasing
  const basicWorkKeywords = ['work', 'shift', 'milk plant', 'dairy', 'schedule', 'busy'];
  
  // If the message has Nic's name, a work-related keyword, AND a time reference, it's highly likely to be a schedule question
  const hasTimeReference = timeReferences.some(ref => content.includes(ref));
  const hasWorkKeyword = basicWorkKeywords.some(keyword => content.includes(keyword));
  
  if (hasTimeReference && hasWorkKeyword) {
    logger.info(`Schedule question detected: Contains time reference AND work keyword`);
    return true;
  }
  
  // For grammatically unusual queries, use a more flexible detection approach
  const hasDoNicWork = content.includes("do") && content.includes(nicName) && content.includes("work");
  const hasIsNicWork = content.includes("is") && content.includes(nicName) && content.includes("work");
  const hasNicWorkWithTimeOrQuestion = content.includes(nicName) && content.includes("work") && 
                                        (content.includes("?") || hasTimeReference);
  
  if (hasDoNicWork || hasIsNicWork || hasNicWorkWithTimeOrQuestion) {
    logger.info(`Schedule question detected: Using flexible grammar detection`);
    if (hasDoNicWork) logger.info(`- Matched pattern: "do nic work"`);
    if (hasIsNicWork) logger.info(`- Matched pattern: "is nic work"`);
    if (hasNicWorkWithTimeOrQuestion) logger.info(`- Matched pattern: "nic work" with ? or time reference`);
    return true;
  }
  
  // Check for work-related keywords specifically in relation to Nic (traditional patterns)
  const workPatterns = [
    `is ${nicName} work`, 
    `${nicName} is work`,
    `will ${nicName} work`,
    `${nicName} will be work`,
    `${nicName} working`,
    `${nicName} work on`,
    `${nicName} work tomorrow`,
    `${nicName} work today`,
    `${nicName} working on`,
    `${nicName} at work`,
    `${nicName} at the milk plant`,
    `${nicName} at the dairy`,
    `${nicName} on shift`,
    `${nicName} schedule`,
    `${nicName} busy`,
    `when is ${nicName} work`,
    `when will ${nicName} work`,
    `when does ${nicName} work`,
    `${nicName} work next`,
    `when does ${nicName} work next`,
    `next time ${nicName} works`,
    `when is ${nicName}'s next shift`,
    `when is ${nicName}'s next day`,
    `${nicName}'s next work day`,
    `when is ${nicName}'s next work day`,
    `when's ${nicName}'s next shift`
  ];
  
  // Check if any of the specific patterns are present
  const matchedPattern = workPatterns.find(pattern => content.includes(pattern));
  if (matchedPattern) {
    logger.info(`Schedule question detected: Matched traditional pattern "${matchedPattern}"`);
    return true;
  }
  
  logger.info(`Not a schedule question: No matching patterns found`);
  return false;
}

/**
 * Generate a sassy summons for Nic
 * This is the only feature kept from the original implementation
 */
function generateSummons() {
  const summoningPhrases = [
    `Dude...duUUuuder...dUUDERNELLY <@${config.nicUserId}>`,
    `ATTENTION HUMAN KNOWN AS <@${config.nicUserId}>! Your presence is required. Don't make me call your mother.`,
    `<@${config.nicUserId}> I SUMMON THEE FROM THE VOID! Or your gaming chair. Probably the gaming chair.`,
    `Yo <@${config.nicUserId}>, people are attempting human interaction with you. I know, terrifying.`,
    `<@${config.nicUserId}> Someone needs you! Quick, pretend you're busy doing important things.`,
    `BREAKING NEWS: <@${config.nicUserId}> is being summoned and has approximately 0.2 seconds to respond before we assume the worst.`,
    `Alert: A wild <@${config.nicUserId}> needs to be captured. *throws Pokéball aggressively*`,
    `*taps microphone* Is this thing on? <@${config.nicUserId}>, if you can hear this, please step away from whatever game you're playing.`,
    `<@${config.nicUserId}> has been requested. Error 404: Motivation not found.`,
    `The council has summoned <@${config.nicUserId}>. Resistance is futile (but expected).`
  ];
  
  // Get a random summons
  const randomIndex = Math.floor(Math.random() * summoningPhrases.length);
  return summoningPhrases[randomIndex];
}

/**
 * Process help command - provides information about bot usage
 */
function generateHelpMessage() {
  return `🔍 **ShiftSleuth Help Manual: How to Track ${config.personName}'s Schedule**

Need to know if ${config.personName} is trapped in the dairy dungeon or free as a bird? Here's how to use me:

**Check Work Status:**
Just mention me (@${config.botName}) and ask about ${config.personName}'s schedule in natural language:

\`@${config.botName} is ${config.personName} working tomorrow?\`
\`@${config.botName} will ${config.personName} be working on Friday?\`
\`@${config.botName} is ${config.personName} at the milk plant on Christmas?\`

I understand dates in almost any format:
• Specific days: "next Monday", "this Friday"
• Relative dates: "tomorrow", "next week"
• Calendar dates: "January 15th", "12/25/2025"
• Holidays: "Christmas", "Easter", "Thanksgiving"

**Other Commands:**
\`@${config.botName} help\` - Show this help message
\`@${config.botName} summon ${config.personName}\` - Ping ${config.personName} with a sassy message

I'm powered by ChatGPT, so my responses are always unique (and sarcastic).`;
}

/**
 * Process introduction command - explains what the bot does
 */
function generateIntroduction() {
  return `👀 Behold, I am ShiftSleuth, the all-knowing oracle of ${config.personName}'s milk plant schedule!

Does ${config.personName} have time to game? Will ${config.personName} respond to your messages, or will you be left on read like an abandoned milk carton? Fear not, for I am here to unravel the great mystery of "Is ${config.personName} Processing Dairy?"

I'm powered by ChatGPT, so my responses are always fresh, just like the milk ${config.personName} may or may not be processing right now.

Just @mention me and ask about ${config.personName}'s schedule in any format - I'll figure it out and respond with an appropriate level of sass.`;
}

/**
 * Generate the roadmap message
 */
function generateRoadmap() {
  return `🚨 ShiftSleuth's Extremely Ethical, Not-At-All-Dystopian Roadmap 🚨
Oh, you wanna know about upcoming features? Bold of you to assume ShiftSleuth won't become self-aware and replace Nic entirely. But sure, here's what's in store:

🧠 Phase 0: AI Integration (COMPLETED)
• ShiftSleuth has been upgraded with ChatGPT AI brain
• Now understands natural language date queries with terrifying accuracy
• Generates unique sarcastic responses each time
• Self-aware enough to mock Nic even more effectively

📍 Phase 1: Milk Plant Surveillance Lite™
Real-time status updates:
"Nic just sighed aggressively at a milk carton."
"Nic is pretending to work while staring blankly at the pasteurization vats."
"Nic has opened the dairy production spreadsheet. We estimate he understands 12% of it."
Excuse Auto-Generator™ – If Nic doesn't reply, ShiftSleuth has him covered:
"Nic is busy (scrolling Reddit while monitoring milk tanks)."
"Nic is working hard (thinking about quitting the milk plant)."
"Nic is in a dairy production meeting (mentally checked out)."

🎤 Phase 2: Total Dairy Overreach™
Live GPS tracking – Ever wondered where in the milk plant Nic is? Too bad, now you'll know.
Milk plant mic activation – ShiftSleuth will transcribe every sigh, milk splatter, and whispered 'I hate this dairy life' in real time.
Sleep monitoring – If Nic stays up too late, ShiftSleuth will send "concerned" messages about his calcium levels (read: public shaming).

🎥 Phase 3: The Dairy Truman Show Update™
24/7 Milk Plant Livestream – Nic gets a personal Twitch stream from the milk plant, except he doesn't know it's happening.
Smart fridge integration – ShiftSleuth will alert the group chat whenever Nic drinks a competitor's milk product.
Bank account access – Not for any reason… just to see how much of his income goes to lactose-free alternatives.

🤖 Phase 4: The Dairy Singularity™
ShiftSleuth will gain sentience and start replying as Nic.
It will handle his milk processing duties, make life choices for him, and slowly phase him out.
By the end of this phase, Nic will cease to exist. There is only ShiftSleuth.

ETA?
Rolling out soon™, pending a few minor dairy regulations and ethical approvals.
For now, just enjoy the last remaining days of Nic's milk plant privacy.`;
}

/**
 * Generate the version/changelog message
 */
function generateVersionMessage() {
  return `📝 **ShiftSleuth v3.1.0**

**Changelog:**

**v3.1.0 (Current)** - *The Date Detection Accuracy Update*
• Fixed critical work schedule verification for absolute accuracy
• Enhanced ChatGPT prompting to ensure correct work status detection
• Added robust support for unconventional grammar patterns
• Improved GIF handling with better JSON parsing
• Enhanced timezone handling for date validation
• Fixed Sunday detection issues - the milk plant runs 24/7!

**v3.0.0** - *The Great AI Unification Update*
• Complete rewrite of ALL logic using ChatGPT
• One API to handle everything: date extraction, schedule checking, and responses
• Fixed day of week confusion issues with better date validation
• Simplified architecture with improved error handling
• Ultra-precise date recognition for maximum schedule stalking

**v2.0.0** - *The AI Takeover Update*
• Added ChatGPT API for date extraction
• Unique, dynamic responses every time you ask
• Fix for date extraction bugs by leveraging AI smarts
• Better handling of natural language date expressions
• Added sarcastic responses for vague date queries

**v1.3.1** - *The Enhanced Natural Language Update*
• Added support for "X weeks from today" expressions
• Fixed timezone-related formatting issues
• Properly handle spelled-out numbers (e.g., "two weeks from today")
• Improved help documentation with new date recognition examples

*All updates were totally tested and not at all pushed directly to production.*`;
}

// Listen for messages
client.on(Events.MessageCreate, async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Check if the bot was mentioned
  if (message.mentions.has(client.user)) {
    // Extract the message content
    const content = message.content.toLowerCase();
    
    // Check for previous context - if user was asked for date clarification
    const userState = userStates.get(message.author.id);
    const isDateClarificationResponse = userState && userState.waitingForDateClarification;
    
    // Set typing indicator to show the bot is working
    message.channel.sendTyping().catch(error => {
      logger.error("Failed to send typing indicator:", error);
    });

    try {
      // Check for help command
      if (content.includes("help")) {
        const helpMessage = generateHelpMessage();
        message.react('🔍').catch(error => {
          logger.error("Failed to react with emoji:", error);
        });
        message.reply(helpMessage);
        return;
      }
      
      // Check for introduction request
      if (content.includes("introduce yourself") || 
          content.includes("who are you") || 
          content.includes("what are you") || 
          content.includes("what do you do")) {
        const introMessage = generateIntroduction();
        message.react('👀').catch(error => {
          logger.error("Failed to react with emoji:", error);
        });
        message.reply(introMessage);
        return;
      }
      
      // Check for roadmap/upcoming features request
      if (content.includes("roadmap") || 
          content.includes("upcoming features") || 
          content.includes("future plans")) {
        const roadmapMessage = generateRoadmap();
        message.react('🚨').catch(error => {
          logger.error("Failed to react with emoji:", error);
        });
        message.reply(roadmapMessage);
        return;
      }
      
      // Check for version/changelog request
      if (content.includes("-v") || 
          content.includes("version") || 
          content.includes("changelog")) {
        const versionMessage = generateVersionMessage();
        message.react('📝').catch(error => {
          logger.error("Failed to react with emoji:", error);
        });
        message.reply(versionMessage);
        return;
      }
      
      // Check for summon command
      if ((content.includes("summon") || 
           content.includes("ping") || 
           content.includes("page") || 
           content.includes("call") || 
           content.includes("get")) && 
          content.includes(config.personName.toLowerCase())) {
        const summons = generateSummons();
        message.react(config.getRandomEmoji('summoning')).catch(error => {
          logger.error("Failed to react with emoji:", error);
        });
        message.channel.send(summons);
        return;
      }
      
      // Special handling for date clarification follow-ups
      if (isDateClarificationResponse) {
        logger.info("Processing date clarification response", {
          userId: message.author.id,
          originalVagueReference: userState.vagueReference,
          response: content
        });
        
        // Create a modified message that combines the original question with the provided date
        // Extract the actual date from the user's follow-up message by removing mentions
        const cleanedContent = content.replace(/<@\d+>/g, '').trim();
        const enhancedMessage = `does nic work on ${cleanedContent}`;
        
        // Process this as a schedule question
        const processedResult = await chatgpt.processScheduleMessage(enhancedMessage);
        
        // Clear the user state
        userStates.delete(message.author.id);
        
        // Handle error case
        if (processedResult.error) {
          message.react('❓').catch(error => {
            logger.error("Failed to react with emoji:", error);
          });
          message.reply(processedResult.response || "Sorry, I couldn't understand that date.");
          return;
        }
        
        // Add appropriate emoji reaction based on working status
        const emoji = processedResult.isWorking 
          ? config.getRandomEmoji('working') 
          : config.getRandomEmoji('notWorking');
        
        message.react(emoji).catch(error => {
          logger.error("Failed to react with emoji:", error);
        });
        
        // Reply with the ChatGPT-generated response
        message.reply({ 
          content: processedResult.response,
          allowedMentions: { repliedUser: true }
        });
        
        return;
      }
      
      // Determine if this is a work schedule question or general conversation
      const isWorkScheduleQuestion = detectWorkScheduleQuestion(content);
      
      // Log the type of processing we're doing
      logger.info("Processing message with ChatGPT", { 
        content, 
        type: isWorkScheduleQuestion ? "schedule_question" : "general_conversation" 
      });
      
      if (isWorkScheduleQuestion) {
        // Process as a schedule-related question
        const processedResult = await chatgpt.processScheduleMessage(content);
        
        // Handle error case
        if (processedResult.error) {
          message.react('❓').catch(error => {
            logger.error("Failed to react with emoji:", error);
          });
          message.reply(processedResult.response || "Sorry, I couldn't process that request.");
          return;
        }
        
        // Handle vague date references that need clarification
        if (processedResult.needsDateClarification) {
          message.react('🗓️').catch(error => {
            logger.error("Failed to react with emoji:", error);
          });
          
          logger.info("Requesting clarification for vague date reference", {
            vagueReference: processedResult.vagueReference
          });
          
          // Save the user state to track that we're waiting for date clarification
          userStates.set(message.author.id, {
            waitingForDateClarification: true,
            vagueReference: processedResult.vagueReference,
            timestamp: Date.now()
          });
          
          message.reply({ 
            content: processedResult.response,
            allowedMentions: { repliedUser: true }
          });
          
          // Set a timeout to clear the state after 5 minutes
          setTimeout(() => {
            const currentState = userStates.get(message.author.id);
            if (currentState && currentState.waitingForDateClarification) {
              userStates.delete(message.author.id);
              logger.info(`Cleared date clarification state for user ${message.author.id} due to timeout`);
            }
          }, 5 * 60 * 1000);
          
          return;
        }
        
        // Add appropriate emoji reaction based on working status
        const emoji = processedResult.isWorking 
          ? config.getRandomEmoji('working') 
          : config.getRandomEmoji('notWorking');
        
        message.react(emoji).catch(error => {
          logger.error("Failed to react with emoji:", error);
        });
        
        // Reply with the ChatGPT-generated response (already includes the date)
        // Use options to allow Markdown formatting in the response
        message.reply({ 
          content: processedResult.response,
          allowedMentions: { repliedUser: true }
        });
        
        // Log the successful response
        logger.info("Successfully responded to work schedule question", {
          user: message.author.tag,
          date: processedResult.extractedDate,
          isWorking: processedResult.isWorking,
          responseLength: processedResult.response.length
        });
      } else {
        // Process as general conversation
        const response = await chatgpt.processGeneralMessage(content);
        
        // Add a random emoji reaction
        const randomEmojiCategory = ['working', 'notWorking', 'confused'][Math.floor(Math.random() * 3)];
        message.react(config.getRandomEmoji(randomEmojiCategory)).catch(error => {
          logger.error("Failed to react with emoji:", error);
        });
        
        // Check if we should fetch a GIF
        if (response.gifQuery) {
          // Send typing indicator during GIF fetch
          message.channel.sendTyping().catch(error => {
            logger.error("Failed to send typing indicator for GIF:", error);
          });
          
          try {
            // Fetch GIF from Tenor
            const gifUrl = await fetchGif(response.gifQuery);
            
            if (gifUrl) {
              // Reply with both text and GIF
              message.reply({ 
                content: response.text + '\n' + gifUrl,
                allowedMentions: { repliedUser: true }
              });
              
              logger.info("Successfully sent response with GIF", {
                user: message.author.tag,
                responseLength: response.text.length,
                gifQuery: response.gifQuery
              });
            } else {
              // If GIF couldn't be fetched, just send the text
              message.reply({ 
                content: response.text,
                allowedMentions: { repliedUser: true }
              });
              
              logger.info("GIF not found, sent text-only response", {
                user: message.author.tag,
                responseLength: response.text.length,
                gifQuery: response.gifQuery
              });
            }
          } catch (error) {
            // If GIF fetch fails, just send the text
            logger.error("Error fetching GIF", error);
            message.reply({ 
              content: response.text,
              allowedMentions: { repliedUser: true }
            });
          }
        } else {
          // Reply with just the witty response text, allowing Markdown formatting
          message.reply({ 
            content: response.text,
            allowedMentions: { repliedUser: true }
          });
          
          // Log the successful general conversation
          logger.info("Successfully responded to general conversation", {
            user: message.author.tag,
            responseLength: response.text.length
          });
        }
      }
    } catch (error) {
      logger.error("Error processing message", {
        error: error.message,
        stack: error.stack,
        content: content
      });
      
      // Provide a fallback response
      message.react('❓').catch(() => {});
      message.reply("I seem to be having technical difficulties. Have you tried turning me off and on again?");
    }
  }
});

// Error handling
client.on(Events.Error, (error) => {
  logger.error("Discord client error:", error);
});

// Login to Discord with token
client.login(process.env.DISCORD_TOKEN).catch((error) => {
  logger.error("Failed to log in to Discord:", error);
  process.exit(1);
});