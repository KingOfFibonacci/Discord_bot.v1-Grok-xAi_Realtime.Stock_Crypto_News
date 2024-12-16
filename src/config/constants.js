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
        'Bloomberg Crypto',
        'Financial Times Crypto',
        'CoinDesk',
        'Forbes Digital Assets',
        'The Block'
    ],
    TIER_2: [
        'Cointelegraph',
        'Decrypt',
        'Bitcoin Magazine',
        'The Defiant',
        'Yahoo Finance Bitcoin',
        'Bitcoin.com',
        'Blockworks'
    ],
    TIER_3: [
        'CryptoSlate',
        'Crypto Briefing',
        'CCData',
        'Kraken Blog',
        'BeInCrypto',
        'CryptoPotato',
        'CoinGape',
        'Crypto News'
    ],
    TIER_4: [
        'Bitcoinist',
        'NewsBTC',
        'AMB Crypto',
        'Cryptopolitan',
        'U.Today',
        'Invezz',
        'NFT News'
    ],
    TIER_5: [
        'CoinPedia',
        'CoinOtag',
        'CryptoNewsZ',
        'Times Tabloid',
        'CoinPaper',
        'Crypto Intelligence',
        'CoinTurken',
        'BitDegree',
        'CryptoKnowmics',
        'CoinCu'
    ]
}; 