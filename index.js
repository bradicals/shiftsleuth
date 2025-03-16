// Main entry point for the Discord bot
require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const config = require('./config');

// Initialize Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// When the client is ready, run this code once
client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Dudernelly is ready! Tracking schedule for ${config.personName}`);
});

// Listen for messages
client.on(Events.MessageCreate, message => {
  // Ignore bot messages
  if (message.author.bot) return;
  
  // Check if the bot was mentioned
  if (message.mentions.has(client.user)) {
    // Extract the message content
    const content = message.content.toLowerCase();
    
    // Define regex to match queries like "is [name] working today?"
    const workingRegex = new RegExp(`is ${config.personName.toLowerCase()} working today\??`);
    
    if (workingRegex.test(content)) {
      // Get the current date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Check if the person is working today
      const isWorking = config.workSchedule.includes(today);
      
      // Respond accordingly
      if (isWorking) {
        message.reply(`Yes, ${config.personName} is working today.`);
      } else {
        message.reply(`No, ${config.personName} is not working today.`);
      }
    } else if (content.includes('working') && content.includes(config.personName.toLowerCase())) {
      // Handle similar queries with error handling
      message.reply(`I can only tell you if ${config.personName} is working today. Please ask "is ${config.personName} working today?"`); 
    }
  }
});

// Error handling
client.on(Events.Error, error => {
  console.error('Discord client error:', error);
});

// Login to Discord with token
client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('Failed to log in to Discord:', error);
  process.exit(1);
});
