import { getMarketData } from '../../services/schwabService.js';

export const marketCommand = async (messageContent) => {
    const symbol = messageContent.slice(8).trim(); // Assuming the command starts with '!market '
    try {
        const marketData = await getMarketData(symbol);
        // Format and send the market data as a response
        return `Market Data for ${symbol}: ${JSON.stringify(marketData)}`;
    } catch (error) {
        return "Failed to retrieve market data. Please try again later.";
    }
}; 