import axios from 'axios';
import { API } from '../../config/constants.js';

export const rateCommand = async () => {
    try {
        const response = await axios.get(
            'https://min-api.cryptocompare.com/stats/rate/limit',
            {
                params: {
                    api_key: process.env.CRYPTOCOMPARE_API_KEY
                }
            }
        );

        console.log('Rate limit response:', JSON.stringify(response.data, null, 2));

        if (!response.data || response.data.Response === "Error") {
            return `Error: ${response.data?.Message || 'Unable to fetch rate limit data'}`;
        }

        const { calls_made, calls_left } = response.data.Data;
        
        return `CryptoCompare API Usage:\n\n` +
               `Per Second:\n` +
               `Made: ${calls_made.second}\n` +
               `Left: ${calls_left.second}\n\n` +
               `Per Minute:\n` +
               `Made: ${calls_made.minute}\n` +
               `Left: ${calls_left.minute}\n\n` +
               `Per Hour:\n` +
               `Made: ${calls_made.hour}\n` +
               `Left: ${calls_left.hour}\n\n` +
               `Per Day:\n` +
               `Made: ${calls_made.day}\n` +
               `Left: ${calls_left.day}\n\n` +
               `Per Month:\n` +
               `Made: ${calls_made.month}\n` +
               `Left: ${calls_left.month}`;

    } catch (error) {
        console.error('Error checking rate limit:', error);
        return `Error fetching rate limit data: ${error.message}`;
    }
}; 