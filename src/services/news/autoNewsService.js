import axios from 'axios';
import dotenv from 'dotenv';
import { EventEmitter } from 'events';
import { EmbedBuilder } from 'discord.js';
import { DISCORD } from '../../config/settings.js';

dotenv.config();

const API_BASE_URL = 'https://api.thenewsapi.com/v1/news';
const API_KEY = process.env.THE_NEWS_API_KEY;
const UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds
const CATEGORIES = ['general', 'science', 'sports', 'business', 'health', 'entertainment', 'tech', 'politics', 'food', 'travel'];

class AutoNewsService extends EventEmitter {
    constructor() {
        super();
        this.apiKey = API_KEY;
        this.baseUrl = API_BASE_URL;
        this.channel = null;
        this.categoryThreads = new Map();
        this.updateInterval = null;
        this.lastNewsIds = new Set(); // Track posted news to avoid duplicates
    }

    async initializeChannel(client) {
        try {
            // Get the main news channel
            this.channel = await client.channels.fetch(DISCORD.AUTO_NEWS_CHANNEL_ID);
            
            // Initialize category threads
            await this.initializeCategoryThreads();
            
            // Start automatic updates
            await this.startAutoUpdates();
            
            console.log('Auto news service initialized successfully');
        } catch (error) {
            console.error('Error initializing auto news service:', error);
        }
    }

    async initializeCategoryThreads() {
        try {
            // Get existing threads
            const threads = await this.channel.threads.fetch();
            
            // Create or get threads for each category
            for (const category of CATEGORIES) {
                const threadName = `📰 ${category.charAt(0).toUpperCase() + category.slice(1)} News`;
                let thread = threads.threads.find(t => t.name === threadName);
                
                if (!thread) {
                    // Create initial message embed
                    const initialEmbed = new EmbedBuilder()
                        .setColor(this.getCategoryColor(category))
                        .setTitle(`${category.charAt(0).toUpperCase() + category.slice(1)} News Feed`)
                        .setDescription('This thread will be automatically updated with the latest news in this category.')
                        .addFields(
                            { name: 'Update Frequency', value: 'Every 15 minutes', inline: true },
                            { name: 'News per Update', value: '3 articles', inline: true }
                        )
                        .setFooter({ text: `Category: ${category}` })
                        .setTimestamp();

                    // Create forum thread with initial message
                    thread = await this.channel.threads.create({
                        name: threadName,
                        message: {
                            embeds: [initialEmbed]
                        },
                        autoArchiveDuration: 24 * 60, // 1 day
                        reason: `Auto news thread for ${category}`
                    });
                }
                
                this.categoryThreads.set(category, thread);
            }
        } catch (error) {
            console.error('Error initializing category threads:', error);
            throw error;
        }
    }

    async startAutoUpdates() {
        // Initial update
        await this.fetchAndPostNews();
        
        // Set up interval for future updates
        this.updateInterval = setInterval(() => this.fetchAndPostNews(), UPDATE_INTERVAL);
        console.log(`Auto news updates scheduled every ${UPDATE_INTERVAL / 1000 / 60} minutes`);
    }

    async fetchAndPostNews() {
        try {
            // Fetch news for each category
            for (const category of CATEGORIES) {
                const thread = this.categoryThreads.get(category);
                if (!thread) continue;

                const news = await this.getTopStories({
                    categories: category,
                    limit: 3,
                    language: 'en',
                    locale: 'us'
                });

                if (news.data && news.data.length > 0) {
                    await this.postNewsToThread(thread, news.data, category);
                }

                // Wait 1 second between category requests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.error('Error in auto news update:', error);
        }
    }

    async postNewsToThread(thread, newsItems, category) {
        try {
            for (const news of newsItems) {
                // Skip if already posted
                if (this.lastNewsIds.has(news.uuid)) continue;

                const embed = new EmbedBuilder()
                    .setColor(this.getCategoryColor(category))
                    .setTitle(news.title)
                    .setDescription(news.description || news.snippet || 'No description available')
                    .setURL(news.url)
                    .addFields(
                        { name: 'Source', value: news.source, inline: true },
                        { name: 'Published', value: new Date(news.published_at).toLocaleString(), inline: true }
                    )
                    .setFooter({ text: `Category: ${category}` })
                    .setTimestamp();

                if (news.image_url) {
                    embed.setImage(news.image_url);
                }

                await thread.send({ embeds: [embed] });
                this.lastNewsIds.add(news.uuid);

                // Keep lastNewsIds size manageable
                if (this.lastNewsIds.size > 1000) {
                    const idsArray = Array.from(this.lastNewsIds);
                    this.lastNewsIds = new Set(idsArray.slice(idsArray.length - 500));
                }
            }
        } catch (error) {
            console.error(`Error posting news to ${category} thread:`, error);
        }
    }

    getCategoryColor(category) {
        const colors = {
            general: '#808080',
            science: '#00FF00',
            sports: '#FF4500',
            business: '#0000FF',
            health: '#FF69B4',
            entertainment: '#FFD700',
            tech: '#9400D3',
            politics: '#DC143C',
            food: '#FFA500',
            travel: '#20B2AA'
        };
        return colors[category] || '#808080';
    }

    // Helper method for making API requests
    async makeRequest(endpoint, params = {}) {
        try {
            const url = `${this.baseUrl}/${endpoint}`;
            const response = await axios.get(url, {
                params: {
                    api_token: this.apiKey,
                    ...params
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Error making request to ${endpoint}:`, error.message);
            throw error;
        }
    }

    // Get headlines by category
    async getHeadlines(options = {}) {
        try {
            const params = {
                locale: options.locale || 'us',
                language: options.language || 'en',
                headlines_per_category: options.headlinesPerCategory || 6,
                include_similar: options.includeSimilar !== false
            };

            return await this.makeRequest('headlines', params);
        } catch (error) {
            console.error('Error fetching headlines:', error);
            throw error;
        }
    }

    // Get top stories with advanced filtering
    async getTopStories(options = {}) {
        try {
            const params = {
                locale: options.locale || 'us',
                language: options.language || 'en',
                limit: options.limit || 10,
                categories: options.categories,
                search: options.search,
                search_fields: options.searchFields,
                domains: options.domains,
                exclude_domains: options.excludeDomains,
                published_before: options.publishedBefore,
                published_after: options.publishedAfter,
                published_on: options.publishedOn,
                sort: options.sort || 'published_at'
            };

            return await this.makeRequest('top', params);
        } catch (error) {
            console.error('Error fetching top stories:', error);
            throw error;
        }
    }

    // Get available news sources with caching
    async getSources(options = {}) {
        try {
            const params = {
                categories: options.categories,
                exclude_categories: options.excludeCategories,
                language: options.language,
                page: options.page || 1
            };

            const response = await this.makeRequest('sources', params);
            return response;
        } catch (error) {
            console.error('Error fetching sources:', error);
            throw error;
        }
    }

    // Cleanup method
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

export const autoNewsService = new AutoNewsService();
