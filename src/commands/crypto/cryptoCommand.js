import { getCryptoPrice, getCryptoNews } from '../../services/crypto/cryptoService.js';
import { NEWS_CATEGORIES } from '../../config/constants.js';

export const cryptoCommand = async (messageContent) => {
    const args = messageContent.split(' ');
    const subCommand = args[1]?.toLowerCase();
    let symbols = args.slice(2).map(s => s.toUpperCase());
    let category = args[args.length - 1]?.toUpperCase();

    if (!subCommand) {
        return "Usage: !crypto [price|news|categories] [symbol(s)] [category?]";
    }

    try {
        switch (subCommand) {
            case 'price':
                if (!symbols.length) {
                    return "Please provide crypto symbol(s). Example: !crypto price BTC ETH";
                }
                const priceData = await getCryptoPrice(symbols);
                
                if (Array.isArray(priceData)) {
                    return priceData.map(data => {
                        const changeEmoji = data.change24h >= 0 ? '📈' : '📉';
                        return `${data.symbol} Price Stats:\n` +
                               `💰 Current Price: $${data.price.toLocaleString()}\n` +
                               `${changeEmoji} 24h Change: $${data.change24h.toFixed(2)} (${data.changePercent24h.toFixed(2)}%)\n` +
                               `⏰ Last Updated: ${data.timestamp}\n`;
                    }).join('\n');
                } else {
                    const changeEmoji = priceData.change24h >= 0 ? '📈' : '📉';
                    return `${priceData.symbol} Price Stats:\n` +
                           `💰 Current Price: $${priceData.price.toLocaleString()}\n` +
                           `${changeEmoji} 24h Change: $${priceData.change24h.toFixed(2)} (${priceData.changePercent24h.toFixed(2)}%)\n` +
                           `⏰ Last Updated: ${priceData.timestamp}`;
                }

            case 'news':
                const options = {};
                if (symbols.length) {
                    options.symbols = symbols;
                }
                if (category && NEWS_CATEGORIES[category]) {
                    options.category = category;
                }

                const news = await getCryptoNews(options);
                let response = `📰 Crypto News${symbols.length ? ` for ${symbols.join(', ')}` : ''}${category ? ` (${category})` : ''}:\n\n`;
                news.forEach((article, index) => {
                    response += `[${article.title}](${article.url})\n` +
                              `📱 Source: ${article.source}\n` +
                              `🏷️ Categories: ${article.categories}\n` +
                              `⏰ ${article.date} ${article.time}\n\n`;
                });
                return response;

            case 'categories':
                return `Available news categories:\n${Object.keys(NEWS_CATEGORIES).join('\n')}`;

            default:
                return "Invalid command. Use !crypto [price|news|categories] [symbol(s)] [category?]";
        }
    } catch (error) {
        console.error("Error in crypto command:", error);
        return `Error: ${error.message}`;
    }
};
