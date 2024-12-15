import axios from 'axios';
import { twitterClient } from '../clients/twitterClient.js';

export const sendTweet = async (tweetMessage, mediaUrl) => {
    try {
        console.log(`Sending tweet with message: "${tweetMessage}"`);

        let mediaId;
        if (mediaUrl) {
            console.log(`Fetching media from URL: ${mediaUrl}`);
            const mediaData = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
            console.log('Media data fetched successfully.');

            // Upload media and get media ID
            mediaId = await twitterClient.v1.uploadMedia(Buffer.from(mediaData.data), {
                mimeType: 'image/png', // Adjust as necessary
            });

            // Log the media ID directly
            console.log(`Media uploaded successfully. Media ID: ${mediaId}`);
        }

        // Send the tweet with or without media
        const tweetPayload = {
            text: tweetMessage,
            ...(mediaId && { media: { media_ids: [mediaId] } }), // Include media if available
        };

        const response = await twitterClient.v2.post('tweets', tweetPayload);
        console.log('Tweet sent successfully:', response);
    } catch (error) {
        console.error('Error sending tweet:', error.response?.data || error.message);
    }
};