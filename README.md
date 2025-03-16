# ScheduleBot

A Discord bot that checks if a specific person is working on the current date.

## Features

- Responds to mentions with "@bot is [name] working today?"
- Checks a predefined schedule to determine if the person is working
- Easy to configure and update the work schedule

## Setup Instructions

### Prerequisites

- Node.js (v16.9.0 or higher)
- npm (Node package manager)
- A Discord account and a registered Discord application/bot

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a Discord bot and get your token:
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a New Application
   - Go to the "Bot" tab and click "Add Bot"
   - Under the "TOKEN" section, click "Copy" to copy your token

4. Configure your environment:
   - Edit the `.env` file and replace `your_discord_bot_token_here` with your Discord bot token

5. Configure the person's schedule:
   - Edit the `config.js` file to set the person's name and their working dates

### Bot Permissions

When adding the bot to your server, ensure it has the following permissions:
- Read Messages/View Channels
- Send Messages
- Read Message History

### Running the Bot

Start the bot with:
```
node index.js
```

## Usage

Once the bot is running and added to your server, you can mention it with a query:

```
@YourBotName is John Doe working today?
```

The bot will respond with whether the person is working today or not based on the configured schedule.

## Updating the Schedule

To update the work schedule, edit the `workSchedule` array in the `config.js` file. Add or remove dates in the 'YYYY-MM-DD' format.

## Error Handling

The bot includes basic error handling for:
- Invalid queries
- Discord API errors
- Authentication issues

## License

This project is open source and available under the MIT License.
