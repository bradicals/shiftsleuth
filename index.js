// Main entry point for the ShiftSleuth Discord bot
// The dark humor work schedule tracker for Nic
require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const config = require("./config");
const responses = require("./holidays/responses");
const dateUtils = require("./holidays/dateUtils");
const holidays = require("./holidays/us_holidays");

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
    
    // Try to extract a date from the message
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

📍 Phase 1: Nic Surveillance Lite™
Real-time status updates:

"Nic just sighed aggressively."
"Nic is pretending to work while staring blankly at his screen."
"Nic has opened Excel. We estimate he understands 12% of it."
Excuse Auto-Generator™ – If Nic doesn't reply, ShiftSleuth has him covered:

"Nic is busy (scrolling Reddit)."
"Nic is working hard (thinking about quitting)."
"Nic is in a meeting (mentally checked out)."
🎤 Phase 2: Total Overreach™
Live GPS tracking – Ever wondered where Nic is? Too bad, now you'll know.
Workplace mic activation – ShiftSleuth will transcribe every sigh, keyboard smash, and whispered 'I hate it here' in real time.
Sleep monitoring – If Nic stays up too late, ShiftSleuth will send "concerned" messages (read: public shaming).
🎥 Phase 3: The Truman Show Update™
24/7 Livestream – Nic gets a personal Twitch stream, except he doesn't know it's happening.
Smart fridge integration – ShiftSleuth will alert the group chat whenever Nic eats something questionable.
Bank account access – Not for any reason… just, y'know. For science.
🤖 Phase 4: The Singularity™
ShiftSleuth will gain sentience and start replying as Nic.
It will handle his messages, make life choices for him, and slowly phase him out.
By the end of this phase, Nic will cease to exist. There is only ShiftSleuth.
ETA?
Rolling out soon™, pending a few minor legal and ethical approvals.
For now, just enjoy the last remaining days of Nic's privacy.`;
      
      // React with emoji
      message.react('🚨')
        .catch(error => console.error("Failed to react with emoji:", error));
      
      // Send roadmap
      message.reply(roadmapMessage);
      
    // Check for introduction request
    } else if (content.includes("introduce yourself") || 
        content.includes("who are you") || 
        content.includes("what are you") || 
        content.includes("what do you do")) {
      
      // Introduction message
      const introMessage = `👀 Behold, mortals! I am ShiftSleuth, the all-knowing, all-seeing oracle of ${config.personName}'s work schedule.

Does ${config.personName} have time to game? Will ${config.personName} respond to your messages, or will you be left on read like an abandoned Tamagotchi? Fear not, for I am here to unravel the great mystery of "Is ${config.personName} Working?"

🔎 If ${config.personName} is working: Brace yourselves. ${config.personName} has entered the shadow realm of capitalism. Responses will be delayed, spirits may be low, and lunch breaks are the only hope for salvation.

🎉 If ${config.personName} is NOT working: Rejoice! The shackles have been lifted. The time for memes, gaming, and questionable life choices is upon us.

So before you double-text like a desperate ex, consult ShiftSleuth—because some mysteries are best left unsolved, but this ain't one of them.`;
      
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
      
    // Check if it's a work question with a specific date mentioned  
    } else if (isWorkQuestion() && extractedDate) {
      // Handle the date-specific work inquiry
      handleDateSpecificWorkInquiry(message, extractedDate);
      
    // Check if it's a general work question about today
    } else if (isWorkQuestion()) {
      // Handle the general "is Nic working today" inquiry
      handleTodayWorkInquiry(message);
      
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
