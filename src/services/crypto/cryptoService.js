import axios from 'axios';
import dotenv from 'dotenv';
import { API, NEWS_CATEGORIES } from '../../config/constants.js';

dotenv.config();

const CRYPTOCOMPARE_API_KEY = process.env.CRYPTOCOMPARE_API_KEY;
const BASE_URL = API.CRYPTOCOMPARE.BASE_URL;

export const getCryptoPrice = async (symbols) => {
    try {
        // Convert single symbol to array if needed
        const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
        const cleanSymbols = symbolArray.map(s => s.replace('$', '').toUpperCase());
        
        // Use multi-symbol endpoint
        const response = await axios.get(
            `${BASE_URL}/pricemultifull?fsyms=${cleanSymbols.join(',')}&tsyms=USD&api_key=${CRYPTOCOMPARE_API_KEY}`
        );

        if (!response.data || !response.data.RAW) {
            throw new Error(`No price data available for ${cleanSymbols.join(', ')}`);
        }

        const results = [];
        for (const symbol in response.data.RAW) {
            const data = response.data.RAW[symbol].USD;
            results.push({
                symbol,
                price: data.PRICE,
                change24h: data.CHANGE24HOUR,
                changePercent24h: data.CHANGEPCT24HOUR,
                volume24h: data.VOLUME24HOUR,
                timestamp: new Date(data.LASTUPDATE * 1000).toLocaleString()
            });
        }

        // Return array if multiple symbols, single object if one symbol
        return Array.isArray(symbols) ? results : results[0];
    } catch (error) {
        console.error("Error fetching crypto prices:", error);
        throw new Error(`Unable to fetch prices for ${Array.isArray(symbols) ? symbols.join(', ') : symbols}`);
    }
};

export const getCryptoNews = async (options = {}) => {
    try {
        let categories = [];
        
        // Handle symbol-specific categories
        if (options.symbol) {
            categories.push(options.symbol.toUpperCase());
        }
        
        // Handle predefined category groups
        if (options.category && NEWS_CATEGORIES[options.category.toUpperCase()]) {
            categories = [...categories, ...NEWS_CATEGORIES[options.category.toUpperCase()]];
        }
        
        // Remove duplicates and join
        const categoryString = [...new Set(categories)].join(',');
        
        const url = `${BASE_URL}/v2/news/?${categoryString ? `categories=${categoryString}&` : ''}excludeCategories=Sponsored&api_key=${CRYPTOCOMPARE_API_KEY}`;
        console.log('Fetching news from:', url);

        const response = await axios.get(url);

        if (!response.data || !response.data.Data) {
            throw new Error('No news found');
        }

        return response.data.Data.slice(0, options.limit || 3).map(article => ({
            title: article.title,
            source: article.source,
            categories: article.categories,
            date: new Date(article.published_on * 1000).toLocaleDateString(),
            time: new Date(article.published_on * 1000).toLocaleTimeString(),
            url: article.url
        }));
    } catch (error) {
        console.error("Error fetching crypto news:", error);
        throw new Error(`Unable to fetch crypto news: ${error.message}`);
    }
};
