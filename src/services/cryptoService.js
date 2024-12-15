import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CRYPTOCOMPARE_API_KEY = process.env.CRYPTOCOMPARE_API_KEY;
const BASE_URL = 'https://min-api.cryptocompare.com/data';

// Common categories that users might want to filter by
export const NEWS_CATEGORIES = {
    TRADING: ['Trading', 'Market', 'Analysis'],
    TECHNOLOGY: ['Blockchain', 'Technology', 'Mining'],
    BUSINESS: ['Business', 'Exchange', 'Regulation'],
    DEFI: ['DeFi', 'Ethereum', 'Trading'],
    NFT: ['NFT', 'Blockchain', 'Technology'],
    REGULATION: ['Regulation', 'Business', 'Legal'],
    MINING: ['Mining', 'Technology', 'Bitcoin'],
    EXCHANGE: ['Exchange', 'Trading', 'Business']
};

export const getCryptoPrice = async (symbol) => {
    try {
        const cleanSymbol = symbol.replace('$', '').toUpperCase();
        const response = await axios.get(
            `${BASE_URL}/price?fsym=${cleanSymbol}&tsyms=USD&api_key=${CRYPTOCOMPARE_API_KEY}`
        );

        if (!response.data || !response.data.USD) {
            throw new Error(`No price data available for ${cleanSymbol}`);
        }

        // Get additional data for 24h change
        const dailyData = await axios.get(
            `${BASE_URL}/v2/histohour?fsym=${cleanSymbol}&tsym=USD&limit=24&api_key=${CRYPTOCOMPARE_API_KEY}`
        );

        const currentPrice = response.data.USD;
        const dayOpen = dailyData.data.Data.Data[0].open;
        const priceChange = currentPrice - dayOpen;
        const priceChangePercent = (priceChange / dayOpen) * 100;

        return {
            symbol: cleanSymbol,
            price: currentPrice,
            change24h: priceChange,
            changePercent24h: priceChangePercent,
            timestamp: new Date().toLocaleString()
        };
    } catch (error) {
        console.error("Error fetching crypto price:", error);
        throw new Error(`Unable to fetch price for ${symbol}`);
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
