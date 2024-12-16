import { EventEmitter } from 'events';
import axios from 'axios';
import dotenv from 'dotenv';
import { API, NEWS_SOURCES_TIERS } from '../../config/constants.js';
import { EmbedBuilder } from 'discord.js';
import { DISCORD } from '../../config/settings.js';

dotenv.config();

const CRYPTOCOMPARE_API_KEY = process.env.CRYPTOCOMPARE_API_KEY;
const UPDATE_INTERVAL = 900000; // 15 minutes in milliseconds
const MAX_NEWS_ITEMS = 5;

class CryptoNewsTrackerService extends EventEmitter {
    constructor() {
        super();
        this.lastNewsTimestamp = new Date();
        this.updateInterval = null;
        this.trackingMessage = null;
        this.channel = null;
        this.currentNews = new Set(); // Track current news IDs to avoid duplicates
    }

    async initializeChannel(client) {
        try {
            this.channel = await client.channels.fetch(DISCORD.CRYPTO_NEWS_CHANNEL_ID);
            const messages = await this.channel.messages.fetch({ limit: 1 });
            this.trackingMessage = messages.first();
            
            if (!this.trackingMessage) {
                this.trackingMessage = await this.channel.send({
                    embeds: [this.createEmbed([])]
                });
            }

            // Start tracking news
            await this.updateNews();
            this.updateInterval = setInterval(() => this.updateNews(), UPDATE_INTERVAL);
            console.log('News tracker initialized');
        } catch (error) {
            console.error('Error initializing news tracker channel:', error);
        }
    }

    createEmbed(newsItems) {
        const embed = new EmbedBuilder()
            .setTitle('🗞️ Live Crypto News Tracker')
            .setColor('#0099ff')
            .setTimestamp();

        if (newsItems.length === 0) {
            embed.setDescription('No recent news available');
            return embed;
        }

        newsItems.forEach(news => {
            // Only add tier label if it's a recognized source (tier < 5)
            const sourceDisplay = news.tier < 5 ? `[Tier ${news.tier}] ${news.source}` : news.source;
            
            embed.addFields({
                name: news.title,
                value: `Source: ${sourceDisplay}\n` +
                      `Categories: ${news.categories}\n` +
                      `Published: ${news.date} ${news.time}\n` +
                      `[Read More](${news.url})`
            });
        });

        return embed;
    }

    async updateNews() {
        try {
            const response = await axios.get(
                `${API.CRYPTOCOMPARE.BASE_URL}/v2/news/?excludeCategories=Sponsored&limit=50&api_key=${CRYPTOCOMPARE_API_KEY}`
            );

            if (!response.data?.Data) {
                console.log('No news data available');
                return;
            }

            // Debug log to see actual source names
            console.log('Available sources:', response.data.Data.map(article => article.source));

            // Helper function to normalize source names
            const normalizeSourceName = (source) => {
                const sourceMap = {
                    // Tier 1
                    'coindesk': 'CoinDesk',
                    'financialtimes_crypto_': 'Financial Times Crypto',
                    'forbes': 'Forbes Digital Assets',
                    'theblock': 'The Block',
                    'bloomberg': 'Bloomberg Crypto',

                    // Tier 2
                    'cointelegraph': 'Cointelegraph',
                    'decrypt': 'Decrypt',
                    'bitcoinmagazine': 'Bitcoin Magazine',
                    'yahoo': 'Yahoo Finance Bitcoin',
                    'thedefiant': 'The Defiant',

                    // Tier 3
                    'cryptoslate': 'CryptoSlate',
                    'blockworks': 'Blockworks',
                    'cryptobriefing': 'Crypto Briefing',
                    'ccdata': 'CCData',
                    'kraken': 'Kraken Blog',

                    // Tier 4
                    'beincrypto': 'BeInCrypto',
                    'cryptopotato': 'CryptoPotato',
                    'bitcoinist': 'Bitcoinist',
                    'newsbtc': 'NewsBTC',
                    'ambcrypto': 'AMB Crypto',

                    // Common sources we're seeing
                    'coinpedia': 'CoinPedia',
                    'coinotag': 'CoinOtag',
                    'coingape': 'CoinGape',
                    'cryptopolitan': 'Cryptopolitan',
                    'bitcoin.com': 'Bitcoin.com',
                    'utoday': 'U.Today',
                    'cryptonewsz': 'CryptoNewsZ',
                    'nft_news': 'NFT News',
                    'crypto_news': 'Crypto News',
                    'timestabloid': 'Times Tabloid',
                    'coinpaper': 'CoinPaper',
                    'cryptointelligence': 'Crypto Intelligence',
                    'cointurken': 'CoinTurken',
                    'bitdegree': 'BitDegree',
                    'cryptoknowmics': 'CryptoKnowmics',
                    'coincu': 'CoinCu',
                    'invezz': 'Invezz'
                };

                // Convert source to lowercase for case-insensitive matching
                const normalizedSource = sourceMap[source.toLowerCase()] || source;
                return normalizedSource;
            };

            const articles = response.data.Data
                .map(article => {
                    const normalizedSource = normalizeSourceName(article.source);
                    let tier = 5;
                    if (NEWS_SOURCES_TIERS.TIER_1.includes(normalizedSource)) tier = 1;
                    else if (NEWS_SOURCES_TIERS.TIER_2.includes(normalizedSource)) tier = 2;
                    else if (NEWS_SOURCES_TIERS.TIER_3.includes(normalizedSource)) tier = 3;
                    else if (NEWS_SOURCES_TIERS.TIER_4.includes(normalizedSource)) tier = 4;

                    return {
                        id: article.id,
                        title: article.title,
                        source: normalizedSource,
                        categories: article.categories,
                        url: article.url,
                        date: new Date(article.published_on * 1000).toLocaleDateString(),
                        time: new Date(article.published_on * 1000).toLocaleTimeString(),
                        timestamp: article.published_on,
                        tier
                    };
                })
                .filter(article => !this.currentNews.has(article.id))
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, MAX_NEWS_ITEMS);

            if (articles.length > 0) {
                // Update tracking set
                this.currentNews.clear();
                articles.forEach(article => this.currentNews.add(article.id));

                // Update Discord message
                await this.trackingMessage.edit({
                    embeds: [this.createEmbed(articles)]
                });
                console.log(`Updated news feed with ${articles.length} new articles`);
            }
        } catch (error) {
            console.error('Error updating news:', error);
        }
    }
}

export const cryptoNewsTracker = new CryptoNewsTrackerService(); 