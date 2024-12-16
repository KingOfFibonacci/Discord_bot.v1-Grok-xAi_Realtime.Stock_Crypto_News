# Crypto & Market Discord Bot

A powerful Discord bot featuring Grok by xAI for tracking cryptocurrency prices, market data, and more in real-time. Built with Node.js and Discord.js.

## Features

### Crypto Tracking
- Real-time price updates for up to 50 cryptocurrencies
- 30-second refresh rate
- Price change indicators
- 24-hour statistics
- Volume tracking
- Multi-embed display for large lists

### Market Data
- Stock price tracking
- Market news updates
- Company information

### Social Integration
- Twitter posting capability (authorized users only)
- AI-powered responses via xAI integration

## Commands

### Crypto Commands
!track start [symbols]  - Start tracking cryptocurrencies (e.g., !track start BTC ETH DOGE)
!track stop [symbols]   - Stop tracking specific coins or all if no symbols provided
!track list            - Show currently tracked cryptocurrencies
!crypto price [symbol] - Get current price for specific cryptocurrency
!crypto news [symbol]  - Get latest news for a cryptocurrency

### Market Commands
!market price [symbol] - Get current stock price
!market news [symbol]  - Get latest market news for a stock

### Other Commands
!tweet [message]       - Post a tweet (authorized users only)
!grok [message]       - Get AI-powered response

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
    CRYPTO_TRACKER_CHANNEL_ID: 'your_channel_id'
};
```

5. Start the bot:
```bash
npm start
```

## Technical Details

- Uses CryptoCompare API for cryptocurrency data (100k API calls/month limit)
- Implements batch processing for efficient API usage
- Supports up to 50 simultaneous crypto trackers
- Auto-splits large tracking lists into multiple embeds (25 items per embed)
- Real-time updates every 30 seconds

## Dependencies

- discord.js
- axios
- twitter-api-v2
- @polygon.io/client-js
- dotenv

## Notes

- Commands are restricted to authorized users only
- Twitter integration requires valid Twitter API credentials
- Respects API rate limits and implements efficient batching
- Designed for 24/7 operation

## License

MIT License

## Author

[Your Name]
