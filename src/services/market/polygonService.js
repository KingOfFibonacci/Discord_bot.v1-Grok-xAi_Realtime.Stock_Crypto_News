import { polygonClient } from '../../clients/api/polygonClient.js';
import axios from 'axios';
import dotenv from 'dotenv';
import { API } from '../../config/constants.js';

dotenv.config();

export const getStockPrice = async (symbol) => {
    try {
        const cleanSymbol = symbol.replace('$', '');
        
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        console.log(`Fetching stock data for ${cleanSymbol} from ${startDate} to ${endDate}`);
        
        const response = await polygonClient.stocks.aggregates(
            cleanSymbol,
            1,
            'day',
            startDate,
            endDate
        );
        
        console.log('Polygon API Response:', JSON.stringify(response, null, 2));
        
        if (!response || !response.results || response.results.length === 0) {
            console.log('No results found in response');
            throw new Error('No data available');
        }

        const result = response.results[response.results.length - 1];
        return {
            close: result.c.toFixed(2),
            open: result.o.toFixed(2),
            high: result.h.toFixed(2),
            low: result.l.toFixed(2),
            volume: result.v,
            date: new Date(result.t).toISOString().split('T')[0]
        };
    } catch (error) {
        console.error("Error fetching stock price from Polygon:", error);
        console.error("Error details:", error.response?.data || error.message);
        throw error;
    }
};

export const getMarketNews = async (symbol) => {
    try {
        const cleanSymbol = symbol.replace('$', '').toUpperCase();
        
        const response = await axios.get(
            `https://api.polygon.io/v2/reference/news?ticker=${cleanSymbol}&limit=5&sort=published_utc&order=desc&apiKey=${process.env.POLYGON_API_KEY}`
        );
        
        console.log('News API Response:', JSON.stringify(response.data, null, 2));
        
        if (!response.data || !response.data.results || response.data.results.length === 0) {
            throw new Error('No news found');
        }

        return response.data.results.slice(0, 3).map(article => ({
            title: article.title,
            source: article.publisher.name,
            date: new Date(article.published_utc).toLocaleDateString(),
            time: new Date(article.published_utc).toLocaleTimeString(),
            url: article.article_url
        }));
    } catch (error) {
        console.error("Error fetching market news:", error);
        throw new Error(`Unable to fetch recent news for ${symbol}`);
    }
};
