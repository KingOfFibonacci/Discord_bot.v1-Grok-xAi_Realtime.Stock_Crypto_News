import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { handleCommand } from './commands/commandHandler.js';
import { cryptoTracker } from './services/crypto/cryptoTrackerService.js';
import { cryptoNewsTracker } from './services/crypto/cryptoNewsTrackerService.js';
import { stockTracker } from './services/market/stockTrackerService.js';
import { autoNewsService } from './services/news/autoNewsService.js';

dotenv.config();

const discordClient = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

discordClient.on('ready', async () => {
    console.log('Bot is ready!');
    await cryptoTracker.initializeChannel(discordClient);
    await cryptoNewsTracker.initializeChannel(discordClient);
    await stockTracker.initializeChannel(discordClient);
    await autoNewsService.initializeChannel(discordClient);
});

discordClient.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    await handleCommand(message);
});

// Cleanup on shutdown
process.on('SIGINT', () => {
    console.log('Cleaning up...');
    autoNewsService.cleanup();
    process.exit(0);
});

discordClient.login(process.env.DISCORD_TOKEN);