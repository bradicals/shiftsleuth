// Main entry point for the Discord bot
require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const config = require("./config");

//Http Server Ping
const express = require("express");
const app = express();

// Set up a simple route that responds when pinged
app.get("/", (req, res) => {
  res.send("Bot is alive!");
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
    `Dudernelly is ready! Tracking schedule for ${config.personName}`,
  );
});

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
      
      // If it has both person's name and work, or just person's name with a question mark
      if ((containsPersonName && containsWork) || 
          (containsPersonName && containsQuestionMark)) {
        return true;
      }
      
      return false;
    };

    // Check for introduction request
    if (content.includes("introduce yourself") || 
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
      
      // Direct ping using the known username
      const nicUserId = 691311987170476123;
      
      // Ping with custom message
      message.channel.send(`Dude...duUUuuder...dUUDERNELLY <@${nicUserId}>`);
      message.react('📢')
        .catch(error => console.error("Failed to react with emoji:", error));
      
    } else if (isWorkQuestion()) {
      // Get the current date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];

      // Check if the person is working today
      const isWorking = config.workSchedule.includes(today);

      // Arrays of possible emojis
      const workingEmojis = ['💼', '👔', '⏰', '📊', '👨‍💻'];
      const notWorkingEmojis = ['🎮', '🏖️', '😎', '🎉', '🍕'];
      
      // Arrays of possible responses
      const workingResponses = [
        `Yep, ${config.personName} is definitely working today! 💼`,
        `According to my detective skills, ${config.personName} is at work today. 🕵️`,
        `My calendar says ${config.personName} is earning that paycheck today! 💰`,
        `${config.personName} is definitely on the clock today.`,
        `Work day alert! ${config.personName} is busy with work stuff today.`
      ];
      
      const notWorkingResponses = [
        `Nope! ${config.personName} is free today! 🎉`,
        `My investigation shows ${config.personName} is OFF today! 🏖️`,
        `${config.personName} is not working today. Time to plan something fun!`,
        `According to my records, ${config.personName} has the day off! 🎮`,
        `Good news! ${config.personName} isn't working today. Bad news! They have no excuse to ignore your messages.`
      ];

      // Select random emoji and response
      const emojis = isWorking ? workingEmojis : notWorkingEmojis;
      const responses = isWorking ? workingResponses : notWorkingResponses;
      
      const randomEmojiIndex = Math.floor(Math.random() * emojis.length);
      const randomResponseIndex = Math.floor(Math.random() * responses.length);
      
      // Add reaction with emoji
      message.react(emojis[randomEmojiIndex])
        .catch(error => console.error("Failed to react with emoji:", error));
      
      // Reply with random response
      message.reply(responses[randomResponseIndex]);
    } else if (containsPersonName || containsWork) {
      // Handle any remaining messages that might be work-related but don't match our patterns
      const errorResponses = [
        `I can tell you if ${config.personName} is working today. Just ask me directly!`,
        `Hmm, not sure what you're asking. Try mentioning me and asking about ${config.personName}'s work schedule.`,
        `I'm the oracle of ${config.personName}'s work schedule! Ask me if they're working today.`,
        `Try asking me "is ${config.personName} working today?" - that's what I understand best!`,
        `Not sure I understand. Want to know if ${config.personName} is working? Just ask!`
      ];
      
      const randomIndex = Math.floor(Math.random() * errorResponses.length);
      const randomEmoji = ['🤔', '❓', '🙄', '😕', '🧐'][Math.floor(Math.random() * 5)];
      
      message.react(randomEmoji)
        .catch(error => console.error("Failed to react with emoji:", error));
      message.reply(errorResponses[randomIndex]);
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
