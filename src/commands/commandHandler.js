import { tweetCommand } from './twitterCommands/tweetCommand.js';
import { marketCommand } from './marketCommands/marketCommand.js';
import { searchCommand } from './xaiCommands/searchCommand.js';

const commands = {
    '!tweet': tweetCommand,
    '!market': marketCommand,
    '!grok': searchCommand,
};

export const handleCommand = async (message) => {
    const command = message.content.split(' ')[0]; // Get the command part
    const commandFunction = commands[command]; // Look up the command function

    if (commandFunction) {
        const response = await commandFunction(message.content, message); // Pass the message content and message object
        
        // Truncate the response if it exceeds 2000 characters
        const truncatedResponse = response.length > 2000 
            ? response.substring(0, 1997) + '...' // Truncate and add ellipsis
            : response;

        message.reply(truncatedResponse); // Send the response back to the Discord channel
    } else {
        message.reply("Unknown command. Please try again.");
    }
};