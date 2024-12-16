import { tweetCommand } from './twitterCommands/tweetCommand.js';
import { searchCommand } from './xaiCommands/searchCommand.js';
import { marketCommand } from './marketCommands/marketCommand.js';
import { cryptoCommand } from './crypto/cryptoCommand.js';
import { trackCommand } from './crypto/trackCommand.js';
import { DISCORD, COMMANDS } from '../config/settings.js';

const commands = {
    [COMMANDS.TWEET]: tweetCommand,
    [COMMANDS.GROK]: searchCommand,
    [COMMANDS.STOCK]: marketCommand,
    [COMMANDS.CRYPTO]: cryptoCommand,
    [COMMANDS.TRACK]: trackCommand
};

export const handleCommand = async (message) => {
    // Only process messages that start with one of our command prefixes
    if (!Object.keys(commands).some(cmd => message.content.startsWith(cmd))) {
        return;
    }

    // Check if user is authorized
    if (message.author.id !== DISCORD.AUTHORIZED_USER_ID) {
        return message.reply("Sorry, you're not authorized to use these commands.");
    }

    const command = message.content.split(' ')[0];
    const commandFunction = commands[command];

    if (commandFunction) {
        const response = await commandFunction(message.content, message);
        
        // Only reply if the command returns a response
        if (response) {
            const truncatedResponse = (response.length > 2000) 
                ? response.substring(0, 1997) + '...'
                : response;

            message.reply(truncatedResponse);
        }
    } else {
        message.reply("Unknown command. Please try again.");
    }
};