# Discord Crypto & Market Bot

The first discord bot with Grok integration. A powerful Discord bot for real-time cryptocurrency tracking, market data, and news aggregation. Built with Node.js and Discord.js.

## Features

### Crypto Tracking
- Real-time price updates for up to 50 cryptocurrencies
- 30-second refresh rate
- Price change indicators
- 24-hour statistics
- Volume tracking
- Multi-embed display for large lists

### News Aggregation
- Live crypto news updates every 15 minutes
- Tiered source reliability system
- Automatic news filtering and sorting
- Rolling display of latest articles
- Source categorization

### Market Data
- Stock price tracking
- Market news updates
- Company information
- Historical data analysis

### Social Integration
- Twitter posting capability (authorized users only)
- AI-powered responses via xAI integration

## Commands

### Crypto Commands
```
!track start [symbols]  - Start tracking cryptocurrencies
!track stop [symbols]   - Stop tracking specific coins or all
!track list            - Show currently tracked cryptocurrencies
!crypto price [symbol] - Get current price for specific cryptocurrency
!crypto news [symbol]  - Get latest news for a cryptocurrency
!rate                  - Check API usage statistics
```

### Market Commands
```
!market price [symbol] - Get current stock price
!market news [symbol]  - Get latest market news for a stock
```

### Other Commands
```
!tweet [message]       - Post a tweet (authorized users only)
!grok [message]       - Get AI-powered response
```

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your API keys:
```
DISCORD_TOKEN="your_discord_token"
XAI_API_KEY="your_xai_api_key"
CRYPTOCOMPARE_API_KEY="your_cryptocompare_api_key"
POLYGON_API_KEY="your_polygon_api_key"
TWITTER_API_KEY="your_twitter_api_key"
TWITTER_API_SECRET="your_twitter_api_secret"
TWITTER_ACCESS_TOKEN="your_twitter_access_token"
TWITTER_ACCESS_SECRET="your_twitter_access_secret"
```

4. Configure settings in `src/config/settings.js`:
```javascript
export const DISCORD = {
    AUTHORIZED_USER_ID: 'your_discord_user_id',
    CRYPTO_TRACKER_CHANNEL_ID: 'your_channel_id',
    CRYPTO_NEWS_CHANNEL_ID: 'your_news_channel_id'
};
```

5. Start the bot:
```bash
npm start
```

## Technical Details

- Efficient API usage with batch processing
- Supports up to 50 simultaneous crypto trackers
- Auto-splits large tracking lists into multiple embeds
- Real-time price updates every 30 seconds
- News updates every 15 minutes
- Tiered news source reliability system
- Persistent tracking across bot restarts

## Dependencies

- discord.js
- axios
- twitter-api-v2
- @polygon.io/client-js
- dotenv

## Notes

- Commands are restricted to authorized users only
- Twitter integration requires valid Twitter API credentials
- Respects API rate limits through efficient batching
- Designed for 24/7 operation
- Automatic news source categorization
- Rolling updates for both prices and news

## License

MIT License

## Author

[Brandon Welch]
