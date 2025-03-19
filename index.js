// Main entry point for the ShiftSleuth Discord bot
// The dark humor work schedule tracker for Nic
require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const config = require("./config");
const responses = require("./holidays/responses");
const dateUtils = require("./holidays/dateUtils");
const holidays = require("./holidays/us_holidays");
const extractDateFromMessage = require("./extract_date");

// Http Server Ping to keep the bot alive
const express = require("express");
const app = express();

// Set up a simple route that responds when pinged
app.get("/", (req, res) => {
  res.send(`${config.botName} is stalking ${config.personName}'s work schedule...`);
});

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server listening at http://localhost:${process.env.PORT}`);
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
  console.log(`Logged in as ${client.user.tag}`);
  console.log(
    `${config.botName} is ready! Tracking schedule for ${config.personName} (with questionable enthusiasm)`,
  );
});

/**
 * Process a date-specific work inquiry about Nic
 * Handles holiday detection, past/future dates, and invalid formats
 */
function handleDateSpecificWorkInquiry(message, dateObj) {
  // If the date couldn't be parsed
  if (!dateObj) {
    const response = responses.getRandomResponse(responses.dateResponses.invalidDate);
    message.react(config.getRandomEmoji('confused'))
      .catch(error => console.error("Failed to react with emoji:", error));
    return message.reply(response);
  }
  
  // Format to YYYY-MM-DD for checking against our schedule
  const dateStr = dateUtils.formatDate(dateObj);
  
  // Check if the date is in the past
  if (dateUtils.isPastDate(dateObj)) {
    const response = responses.getRandomResponse(responses.dateResponses.askingAboutPast);
    message.react(config.getRandomEmoji('confused'))
      .catch(error => console.error("Failed to react with emoji:", error));
    return message.reply(response);
  }
  
  // Get the year from the date
  const year = dateObj.getFullYear();
  
  // Check if the date is beyond our schedule (e.g., 2026 and later)
  if (year > 2025) {
    const response = responses.getRandomResponse(responses.dateResponses.askingAboutFutureBeyondSchedule);
    message.react(config.getRandomEmoji('confused'))
      .catch(error => console.error("Failed to react with emoji:", error));
    return message.reply(response);
  }
  
  // Check if the date is a holiday
  const holiday = holidays.isHoliday(dateStr);
  
  // Check if Nic is working on this date
  const isWorking = config.isWorkingDate(dateStr);
  
  // Format the date for display
  const formattedDate = dateUtils.formatDateForDisplay(dateObj);
  
  // Check if the date is today or in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
  dateObj.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
  const isToday = today.getTime() === dateObj.getTime(); // Compare timestamps for accurate comparison
  
  // If it's a holiday, give a special response about the holiday
  if (holiday) {
    const responseTemplate = isWorking 
      ? responses.getRandomResponse(isToday ? responses.holidayWorking : responses.futureHolidayWorking)
      : responses.getRandomResponse(isToday ? responses.holidayNotWorking : responses.futureHolidayNotWorking);
    
    // Replace placeholders with actual values
    const response = responseTemplate
      .replace('{holiday}', holiday.name)
      .replace('{emoji}', holiday.emoji);
    
    // React with the holiday emoji
    message.react(holiday.emoji)
      .catch(error => console.error("Failed to react with emoji:", error));
    
    return message.reply(response);
  }
  
  // Regular work day response - use future tense for future dates
  const emoji = isWorking 
    ? config.getRandomEmoji('working') 
    : config.getRandomEmoji('notWorking');
  
  const response = isWorking
    ? responses.getRandomResponse(isToday ? responses.workingResponses : responses.futureWorkingResponses)
    : responses.getRandomResponse(isToday ? responses.notWorkingResponses : responses.futureNotWorkingResponses);
  
  // Add a prefix with the date
  const datePrefix = `On ${formattedDate}: `;
  
  // React with emoji
  message.react(emoji)
    .catch(error => console.error("Failed to react with emoji:", error));
  
  // Reply with the response
  message.reply(datePrefix + response);
}

/**
 * Process a general "is Nic working today" inquiry
 */
function handleTodayWorkInquiry(message) {
  // Get the current date in YYYY-MM-DD format
  const today = new Date();
  const todayStr = dateUtils.formatDate(today);

  // Check if the person is working today
  const isWorking = config.isWorkingDate(todayStr);
  
  // Check if today is a holiday
  const holiday = holidays.isHoliday(todayStr);
  
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
    message.react(holiday.emoji)
      .catch(error => console.error("Failed to react with emoji:", error));
    
    return message.reply(response);
  }
  
  // Regular work day response
  const emoji = isWorking 
    ? config.getRandomEmoji('working') 
    : config.getRandomEmoji('notWorking');
  
  const response = isWorking
    ? responses.getRandomResponse(responses.workingResponses)
    : responses.getRandomResponse(responses.notWorkingResponses);
  
  // React with emoji
  message.react(emoji)
    .catch(error => console.error("Failed to react with emoji:", error));
  
  // Reply with random response
  message.reply(response);
}

/**
 * Generate a sassy summons for Nic
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

// Listen for messages
client.on(Events.MessageCreate, (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Check if the bot was mentioned
  if (message.mentions.has(client.user)) {
    // Extract the message content
    const content = message.content.toLowerCase();

    // Check if message contains these keywords for work status inquiries
    const containsPersonName = content.includes(config.personName.toLowerCase());
    const containsWork = content.includes("work");
    const containsQuestionMark = content.includes("?");
    
    // Function to check if content matches any work-related phrases
    const isWorkQuestion = () => {
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
    };
    
    // Check for specific "tomorrow" requests
    const containsTomorrow = content.includes("tomorrow");
    
    // Try to extract a date from the message using the old method
    // This is kept for backward compatibility
    let extractedDate = dateUtils.extractDateFromString(content);
    
    // If "tomorrow" is mentioned but no date was extracted, set extractedDate to tomorrow
    if (containsTomorrow && !extractedDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      extractedDate = tomorrow;
    }
    
    // Check for roadmap/upcoming features request
    if (content.includes("roadmap") || 
        content.includes("upcoming features") || 
        content.includes("future plans")) {
      
      // Roadmap message
      const roadmapMessage = `🚨 ShiftSleuth's Extremely Ethical, Not-At-All-Dystopian Roadmap 🚨
Oh, you wanna know about upcoming features? Bold of you to assume ShiftSleuth won't become self-aware and replace Nic entirely. But sure, here's what's in store:

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
      
      // React with emoji
      message.react('🚨')
        .catch(error => console.error("Failed to react with emoji:", error));
      
      // Send roadmap
      message.reply(roadmapMessage);
      
    // Check for help request
    } else if (content.includes("help")) {
      
      // Help message
      const helpMessage = `🔍 **ShiftSleuth Help Manual: How to Track ${config.personName}'s Milk Plant Schedule Legally**

Need to know if ${config.personName} is trapped in the dairy dungeon or free as a bird? Here's how to use me:

**Basic Commands:**

\`@${config.botName} is ${config.personName} working?\`
• I'll tell you if ${config.personName} is working TODAY

\`@${config.botName} is ${config.personName} working tomorrow?\`
• Find out if ${config.personName} will be working TOMORROW

**Advanced Date Recognition:**

\`@${config.botName} is ${config.personName} working on Friday?\`
• Simple day references (finds the next occurrence)

\`@${config.botName} is ${config.personName} working this Friday?\`
• "this [day]" references the current week's occurrence

\`@${config.botName} is ${config.personName} working next Friday?\`
• "next [day]" references next week's occurrence 

\`@${config.botName} is ${config.personName} working next week Friday?\`
• "next week [day]" is explicit about which week

\`@${config.botName} is ${config.personName} working on Christmas?\`
• I recognize holidays! Try Easter, Thanksgiving, Halloween, etc.

\`@${config.botName} is ${config.personName} working on April 15?\`
• Month + day formats work too!

\`@${config.botName} is ${config.personName} working on 4/20/2025?\`
• I also accept dates in MM/DD/YYYY format for the precision-obsessed

\`@${config.botName} is ${config.personName} working two weeks from today?\`
• I understand relative dates like "1 week from today" and "three weeks from today"

**Other Fun Stuff:**

\`@${config.botName} summon ${config.personName}\`
• I'll aggressively ping ${config.personName} with a sassy message

\`@${config.botName} introduce yourself\`
• Learn more about my tragic existence

\`@${config.botName} roadmap\`
• See the terrifying future features planned

\`@${config.botName} -v\`
• Check my version and changelog

Remember: I only respond when mentioned. I can't read your mind yet (that feature is coming in v2.0).`;
      
      // React with emoji
      message.react('🔍')
        .catch(error => console.error("Failed to react with emoji:", error));
      
      // Send help message
      message.reply(helpMessage);
      
    // Check for version/changelog request  
    } else if (content.includes("-v") || 
               content.includes("version") || 
               content.includes("changelog")) {
               
      // Version and changelog message
      const versionMessage = `📝 **ShiftSleuth v1.3.1**

**Changelog:**

**v1.3.1 (Current)** - *The Enhanced Natural Language Update*
• Added support for "X weeks from today" expressions
• Fixed timezone-related formatting issues
• Properly handle spelled-out numbers (e.g., "two weeks from today")
• Improved help documentation with new date recognition examples
• Fixed bug with "next week [day]" interpretation
• Better handling of past vs. future days in "this [day]" references

**v1.3.0** - *The Natural Language Update*
• Added advanced natural language date recognition
• Properly differentiate "next Friday" vs "next week Friday"
• Added support for "this [day]" to indicate current week
• Improved holiday detection for major US holidays
• Enhanced month/day format recognition (e.g., "April 15")
• Updated help command with complete date reference guide
• Better handling of ambiguous date references

**v1.2.0** - *The Future Tense Update*
• Added proper future tense responses for upcoming dates
• Fixed bug where the bot would use present tense for future dates
• Added help command for confused humans
• Added version/changelog command
• Fixed holiday message formatting
• Enhanced date parsing for better natural language understanding

**v1.1.0** - *The Existential Crisis Update*
• Added roadmap feature
• Enhanced summoning system for more aggressive ${config.personName} pings
• Improved holiday detection
• Added more sassy responses
• Fixed bug where ${config.personName} had moments of privacy

**v1.0.0** - *Initial Release*
• Basic schedule tracking functionality
• Holiday detection
• Date format parsing
• Sarcastic responses
• ${config.personName} surveillance system initialized

*All updates were totally tested and not at all pushed directly to production.*`;
      
      // React with emoji
      message.react('📝')
        .catch(error => console.error("Failed to react with emoji:", error));
      
      // Send version message
      message.reply(versionMessage);
    
    // Check for introduction request
    } else if (content.includes("introduce yourself") || 
        content.includes("who are you") || 
        content.includes("what are you") || 
        content.includes("what do you do")) {
      
      // Introduction message
      const introMessage = `👀 Behold, mortals! I am ShiftSleuth, the all-knowing, all-seeing oracle of ${config.personName}'s milk plant schedule.

Does ${config.personName} have time to game? Will ${config.personName} respond to your messages, or will you be left on read like an abandoned milk carton? Fear not, for I am here to unravel the great mystery of "Is ${config.personName} Processing Dairy?"

🔎 If ${config.personName} is working: Brace yourselves. ${config.personName} has entered the creamy realm of dairy production. Responses will be delayed, spirits may be low, and milk breaks are the only hope for salvation.

🎉 If ${config.personName} is NOT working: Rejoice! The milk tanks have been shut off. The time for memes, gaming, and questionable life choices is upon us.

So before you double-text like a desperate ex, consult ShiftSleuth—because some mysteries are best left unsolved, but whether Nic is knee-deep in milk ain't one of them.`;
      
      // React with emoji
      message.react('👀')
        .catch(error => console.error("Failed to react with emoji:", error));
      
      // Send introduction
      message.reply(introMessage);
      
    // Check for ping/page request  
    } else if ((content.includes("ping") || 
                content.includes("page") || 
                content.includes("summon") || 
                content.includes("call") || 
                content.includes("get")) && 
               content.includes(config.personName.toLowerCase())) {
      
      // Generate a summons message
      const summons = generateSummons();
      
      // Send the summons
      message.channel.send(summons);
      
      // React with a summoning emoji
      message.react(config.getRandomEmoji('summoning'))
        .catch(error => console.error("Failed to react with emoji:", error));
      
    // Check if it's a work question
    } else if (isWorkQuestion()) {
      // Use our advanced date extraction module
      const dateResult = extractDateFromMessage(content);
      
      if (dateResult) {
        // Handle the date-specific work inquiry
        handleDateSpecificWorkInquiry(message, dateResult.date);
      } else if (extractedDate) {
        // Fallback to the old extraction method if our new method fails
        handleDateSpecificWorkInquiry(message, extractedDate);
      } else {
        // If no date was found, treat it as a question about today
        handleTodayWorkInquiry(message);
      }
      
    // Handle any remaining messages that might be work-related but don't match our patterns
    } else if (containsPersonName || containsWork) {
      const confusedResponse = responses.getRandomResponse(responses.confusedResponses);
      
      // React with a confused emoji
      message.react(config.getRandomEmoji('confused'))
        .catch(error => console.error("Failed to react with emoji:", error));
      
      // Reply with the confused response
      message.reply(confusedResponse);
    }
  }
});

// Error handling
client.on(Events.Error, (error) => {
  console.error("Discord client error:", error);
});

// Login to Discord with token
client.login(process.env.DISCORD_TOKEN).catch((error) => {
  console.error("Failed to log in to Discord:", error);
  process.exit(1);
});
