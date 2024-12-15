import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TWELVE_API_URL = 'https://api.twelvedata.com';

// Function to get market information from TwelveData
export const getMarketDataFromTwelveData = async (symbol) => {
    try {
        const response = await axios.get(`${TWELVE_API_URL}/price`, {
            params: {
                symbol: symbol,
                apikey: process.env.TWELVE_API_KEY
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching market data from TwelveData:", error.response?.data || error.message);
        throw error;
    }
};

// Function to check if a symbol is available as cryptocurrency
export const checkCryptoAvailability = async (symbol) => {
    try {
        const response = await axios.get(`${TWELVE_API_URL}/cryptocurrencies`, {
            params: {
                symbol: symbol,
                apikey: process.env.TWELVE_API_KEY
            },
        });
        return response.data.length > 0;
    } catch (error) {
        console.error("Error checking crypto availability:", error.response?.data || error.message);
        return false;
    }
}; 