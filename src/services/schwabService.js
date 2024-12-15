import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SCHWAB_API_URL = 'https://api.schwab.com'; // Replace with the actual Schwab API base URL

// Function to get market information
export const getMarketData = async (symbol) => {
    try {
        const response = await axios.get(`${SCHWAB_API_URL}/marketdata/${symbol}`, {
            headers: {
                'Authorization': `Bearer ${process.env.SCHWAB_ACCESS_TOKEN}`, // Use your access token
                'Content-Type': 'application/json',
            },
        });
        return response.data; // Return the market data
    } catch (error) {
        console.error("Error fetching market data:", error.message);
        throw error; // Rethrow the error for further handling
    }
}; 