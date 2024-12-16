import axios from 'axios';
import dotenv from 'dotenv';
import { API } from '../../config/constants.js';

dotenv.config();

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
        const response = await axios.post(API.XAI.BASE_URL, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.XAI_API_KEY}`
            }
        });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Error fetching from xAI:", error.message);
        throw error;
    }
};