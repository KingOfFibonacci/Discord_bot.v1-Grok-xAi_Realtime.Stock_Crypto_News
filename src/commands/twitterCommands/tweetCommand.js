import { sendTweet } from '../../services/twitterService.js';

export const tweetCommand = async (messageContent, message) => {
    const tweetMessage = messageContent.slice(7).trim(); // Get the tweet message

    // Check for attachments
    let mediaUrl;
    if (message.attachments.size > 0) {
        mediaUrl = message.attachments.first().url; // Use the URL of the uploaded image
    }

    await sendTweet(tweetMessage, mediaUrl); // Pass the media URL to the sendTweet function
};