import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const XAI_API_URL = 'https://api.x.ai/v1/chat/completions'; // Ensure this is the correct endpoint

// Function to perform a search using the xAI API
export const searchXAI = async (userQuestion) => {
    const requestBody = {
        messages: [
            {
                role: "system",
                content: "You are Grok, a chatbot inspired by the Hitchhikers Guide to the Galaxy."
            },
            {
                role: "user",
                content: userQuestion
            }
        ],
        model: "grok-beta",
        stream: false,
        temperature: 0
    };

    try {
        const response = await axios.post(XAI_API_URL, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.XAI_API_KEY}` // Ensure you have this in your .env file
            }
        });
        return response.data.choices[0].message.content; // Return the assistant's message
    } catch (error) {
        console.error("Error fetching from xAI:", error.message);
        throw error; // Rethrow for handling in the command
    }
};