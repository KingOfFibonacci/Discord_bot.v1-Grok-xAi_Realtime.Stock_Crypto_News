import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { handleCommand } from './commands/commandHandler.js';

dotenv.config();

const discordClient = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

discordClient.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    await handleCommand(message);
});

discordClient.login(process.env.DISCORD_TOKEN);