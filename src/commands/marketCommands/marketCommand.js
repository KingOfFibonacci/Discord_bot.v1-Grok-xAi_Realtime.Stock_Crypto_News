import { getStockPrice, getMarketNews } from '../../services/market/polygonService.js';

export const marketCommand = async (messageContent) => {
    console.log('Market command triggered with:', messageContent); // Debug log

    const args = messageContent.split(' ');
    const subCommand = args[1]?.toLowerCase();
    let symbol = args[2]?.toUpperCase();

    console.log('Parsed arguments:', { subCommand, symbol }); // Debug log

    if (!subCommand || !symbol) {
        return "Usage: !market [price|news] [symbol]";
    }

    symbol = symbol.replace('$', '');
    console.log('Processing market command for symbol:', symbol); // Debug log

    try {
        switch (subCommand) {
            case 'price':
                console.log('Fetching price data...'); // Debug log
                try {
                    const stockData = await getStockPrice(symbol);
                    console.log('Received stock data:', stockData); // Debug log
                    return `${symbol} Stock Stats (${stockData.date}):\n` +
                           `💰 Close: $${stockData.close}\n` +
                           `📊 Open: $${stockData.open}\n` +
                           `⬆️ High: $${stockData.high}\n` +
                           `⬇️ Low: $${stockData.low}\n` +
                           `📊 Volume: ${stockData.volume.toLocaleString()}`;
                } catch (error) {
                    console.error('Error fetching stock price:', error); // Debug log
                    return `Unable to fetch stock price for ${symbol}. ${error.message}`;
                }

            case 'news':
                try {
                    const news = await getMarketNews(symbol);
                    return `📰 Latest News for ${symbol}:\n\n` + 
                           news.map((article, index) => 
                               `${index + 1}. ${article.title}\n` +
                               `📱 Source: ${article.source}\n` +
                               `⏰ ${article.date} ${article.time}\n` +
                               `🔗 ${article.url}\n`
                           ).join('\n');
                } catch (error) {
                    return `Unable to fetch news for ${symbol}. ${error.message}`;
                }

            default:
                return "Invalid command. Use !market [price|news] [symbol]";
        }
    } catch (error) {
        console.error("Error in market command:", error);
        return `An error occurred while fetching market data: ${error.message}`;
    }
};
