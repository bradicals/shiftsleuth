# ShiftSleuth

A Discord bot that checks if a specific person (Nic) is working on any given date, with enhanced natural language date understanding and sarcastic responses powered by ChatGPT.

## Features

- ChatGPT Integration for advanced natural language date understanding
- Dynamically generated sarcastic responses for each query
- Responds to mentions with "@bot is [name] working today?" or any natural language date query
- Checks a predefined schedule to determine if the person is working
- Easy to configure and update the work schedule
- Holiday detection with special responses
- Sassy summoning system to ping the tracked person

## Setup Instructions

### Prerequisites

- Node.js (v16.9.0 or higher)
- npm (Node package manager)
- A Discord account and a registered Discord application/bot
- OpenAI API key for ChatGPT integration

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
   - Make sure to enable the "Message Content Intent" in the Privileged Gateway Intents section

4. Get an OpenAI API key:
   - Go to [OpenAI API](https://platform.openai.com/)
   - Sign up or log in
   - Navigate to the API section and create an API key

5. Configure your environment:
   - Copy the `.env-example` file to `.env`
   - Replace `your_discord_bot_token_here` with your Discord bot token
   - Replace `your_openai_api_key_here` with your OpenAI API key

6. Configure the person's schedule:
   - Edit the `config.js` file to set the person's name and their working dates

### Bot Permissions

When adding the bot to your server, ensure it has the following permissions:
- Read Messages/View Channels
- Send Messages
- Read Message History
- Add Reactions (for emoji reactions)

### Running the Bot

Start the bot with:
```
node index.js
```

## Usage

Once the bot is running and added to your server, you can mention it with various queries:

### Work schedule queries
```
@ShiftSleuth is Nic working today?
@ShiftSleuth is Nic working tomorrow?
@ShiftSleuth is Nic working next Friday?
@ShiftSleuth is Nic working on Christmas?
@ShiftSleuth is Nic working in two weeks?
```

The bot will use ChatGPT to extract the date from your query and respond with a sarcastic message about whether Nic is working on that date.

### Other commands
```
@ShiftSleuth summon Nic         - Ping Nic with a sassy message
@ShiftSleuth help               - Display usage instructions
@ShiftSleuth introduce yourself - Bot introduction
@ShiftSleuth roadmap            - See planned features
@ShiftSleuth -v                 - Version info and changelog
```

## Updating the Schedule

To update the work schedule, edit the `workSchedule` array in the `config.js` file. Add or remove dates in the 'YYYY-MM-DD' format.

## Error Handling

The bot includes comprehensive error handling for:
- ChatGPT API failures (falls back to legacy date extraction)
- Invalid queries (generates sarcastic responses about unclear dates)
- Discord API errors
- Authentication issues

## Debugging and Logs

The bot now logs detailed information about date calculations to the `logs` directory:

- `date_extraction.log`: Logs details of dates extracted by ChatGPT
- `ordinal_date.log`: Logs ordinal date calculations (like "third Wednesday of June")

To view the logs, you can:

1. Run the log viewer script:
   ```
   node view_logs.js
   ```

2. Directly check the log files in the `logs` directory

These logs provide detailed information about how dates are calculated, making it easier to debug date extraction issues.

## Cost Considerations

This bot uses the OpenAI API which has usage-based pricing. Each query to the bot will make 1-2 calls to the API:
1. One call to extract the date from the message (if needed)
2. One call to generate a sarcastic response

Consult OpenAI's pricing page for current rates. For a small Discord server with occasional use, costs should be minimal.

## License

This project is open source and available under the MIT License.
