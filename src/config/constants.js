export const API = {
    CRYPTOCOMPARE: {
        BASE_URL: 'https://min-api.cryptocompare.com/data',
        UPDATE_INTERVAL: 30000,
        MAX_TRACKED_COINS: 50
    },
    XAI: {
        BASE_URL: 'https://api.x.ai/v1/chat/completions'
    },
    POLYGON: {
        BASE_URL: 'https://api.polygon.io'
    },
    TWELVEDATA: {
        BASE_URL: 'https://api.twelvedata.com'
    }
};

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

export const NEWS_SOURCES_TIERS = {
    TIER_1: [
        'CoinDesk',
        'Financial Times Crypto',
        'Forbes Digital Assets',
        'The Block',
        'Bloomberg Crypto'
    ],
    TIER_2: [
        'Cointelegraph',
        'Decrypt',
        'Bitcoin Magazine',
        'Yahoo Finance Bitcoin',
        'The Defiant'
    ],
    TIER_3: [
        'CryptoSlate',
        'Blockworks',
        'Crypto Briefing',
        'CCData',
        'Kraken Blog'
    ],
    TIER_4: [
        'BeInCrypto',
        'CryptoPotato',
        'Bitcoinist',
        'NewsBTC',
        'AMB Crypto'
    ]
}; 