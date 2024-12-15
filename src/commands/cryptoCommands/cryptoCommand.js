import { getCryptoPrice, getCryptoNews, NEWS_CATEGORIES } from '../../services/cryptoService.js';

export const cryptoCommand = async (messageContent) => {
    const args = messageContent.split(' ');
    const subCommand = args[1]?.toLowerCase();
    let symbol = args[2]?.toUpperCase();
    let category = args[3]?.toUpperCase();

    if (!subCommand) {
        return "Usage: !crypto [price|news|categories] [symbol?] [category?]";
    }

    try {
        switch (subCommand) {
            case 'price':
                if (!symbol) {
                    return "Please provide a crypto symbol. Example: !crypto price BTC";
                }
                const priceData = await getCryptoPrice(symbol);
                const changeEmoji = priceData.change24h >= 0 ? '📈' : '📉';
                return `${symbol} Price Stats:\n` +
                       `💰 Current Price: $${priceData.price.toLocaleString()}\n` +
                       `${changeEmoji} 24h Change: $${priceData.change24h.toFixed(2)} (${priceData.changePercent24h.toFixed(2)}%)\n` +
                       `⏰ Last Updated: ${priceData.timestamp}`;

            case 'news':
                const options = {};
                if (symbol && symbol !== 'ALL') {
                    options.symbol = symbol;
                }
                if (category && NEWS_CATEGORIES[category]) {
                    options.category = category;
                }

                const news = await getCryptoNews(options);
                let response = `📰 Crypto News${symbol ? ` for ${symbol}` : ''}${category ? ` (${category})` : ''}:\n\n`;
                news.forEach((article, index) => {
                    response += `${index + 1}. ${article.title}\n` +
                              `📱 Source: ${article.source}\n` +
                              `🏷️ Categories: ${article.categories}\n` +
                              `⏰ ${article.date} ${article.time}\n` +
                              `🔗 ${article.url}\n\n`;
                });
                return response;

            case 'categories':
                return `Available news categories:\n${Object.keys(NEWS_CATEGORIES).join('\n')}`;

            default:
                return "Invalid command. Use !crypto [price|news|categories] [symbol?] [category?]";
        }
    } catch (error) {
        console.error("Error in crypto command:", error);
        return `Error: ${error.message}`;
    }
};
