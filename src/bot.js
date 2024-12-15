import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { handleCommand } from './commands/commandHandler.js'; // Correct import path


dotenv.config();

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

discordClient.on('messageCreate', async (message) => {
    if (message.author.bot) return; // Ignore bot messages
    await handleCommand(message); // Use the command handler
});

discordClient.login(process.env.DISCORD_TOKEN);