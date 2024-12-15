import { tweetCommand } from './twitterCommands/tweetCommand.js';
import { searchCommand } from './xaiCommands/searchCommand.js';
import { marketCommand } from './marketCommands/marketCommand.js';
import { cryptoCommand } from './cryptoCommands/cryptoCommand.js';

// Your Discord user ID
const AUTHORIZED_USER_ID = '711777922813394984'; // Replace with your actual Discord user ID

const commands = {
    '!tweet': tweetCommand,
    '!grok': searchCommand,
    '!market': marketCommand,
    '!crypto': cryptoCommand
};

export const handleCommand = async (message) => {
    const command = message.content.split(' ')[0];
    const commandFunction = commands[command];

    // Check if it's the tweet command and if the user is authorized
    if (command === '!tweet' && message.author.id !== AUTHORIZED_USER_ID) {
        return message.reply("Sorry, you're not authorized to use the tweet command.");
    }

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