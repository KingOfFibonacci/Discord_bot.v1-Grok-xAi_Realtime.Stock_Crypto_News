import { EventEmitter } from 'events';
import axios from 'axios';
import dotenv from 'dotenv';
import { API } from '../../config/constants.js';
import { EmbedBuilder } from 'discord.js';
import { DISCORD } from '../../config/settings.js';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const CRYPTOCOMPARE_API_KEY = process.env.CRYPTOCOMPARE_API_KEY;
const UPDATE_INTERVAL = 30000; // 30 seconds between updates
const MAX_TRACKED_COINS = 50;
const FIELDS_PER_EMBED = 25;
const TRACKED_COINS_PATH = path.join(process.cwd(), 'src', 'data', 'trackedCoins.json');

class CryptoTrackerService extends EventEmitter {
    constructor() {
        super();
        this.trackedCoins = new Map();
        this.lastPrices = new Map();
        this.updateInterval = null;
        this.trackingMessage = null;
        this.channel = null;
    }

    async loadTrackedCoins() {
        try {
            const data = await fs.readFile(TRACKED_COINS_PATH, 'utf8');
            const { trackedSymbols } = JSON.parse(data);
            trackedSymbols.forEach(symbol => {
                this.trackedCoins.set(symbol.toUpperCase(), true);
            });
            console.log('Loaded tracked coins:', trackedSymbols);
        } catch (error) {
            console.error('Error loading tracked coins:', error);
        }
    }

    async saveTrackedCoins() {
        try {
            const trackedSymbols = Array.from(this.trackedCoins.keys());
            const messageId = this.trackingMessage?.id;
            await fs.writeFile(TRACKED_COINS_PATH, JSON.stringify({
                trackedSymbols,
                lastMessageId: messageId
            }, null, 2));
        } catch (error) {
            console.error('Error saving tracked coins:', error);
        }
    }

    async initializeChannel(client) {
        try {
            this.channel = await client.channels.fetch(DISCORD.CRYPTO_TRACKER_CHANNEL_ID);
            
            // Load previously tracked coins
            await this.loadTrackedCoins();
            
            // Find existing tracking message or create new one
            const messages = await this.channel.messages.fetch({ limit: 100 });
            this.trackingMessage = messages.find(m => m.author.id === client.user.id);
            
            if (!this.trackingMessage) {
                this.trackingMessage = await this.channel.send({
                    embeds: this.createEmbeds([])
                });
            }

            // Start tracking if we have coins to track
            if (this.trackedCoins.size > 0) {
                await this.updatePrices();
                this.updateInterval = setInterval(() => this.updatePrices(), UPDATE_INTERVAL);
                console.log('Resumed tracking for', this.trackedCoins.size, 'coins');
            }
        } catch (error) {
            console.error('Error initializing crypto tracker channel:', error);
        }
    }

    createEmbed(updates) {
        const embed = new EmbedBuilder()
            .setTitle('🚀 Live Crypto Price Tracker')
            .setColor('#0099ff')
            .setTimestamp();

        if (updates.length === 0) {
            embed.setDescription('No cryptocurrencies currently tracked');
            return embed;
        }

        updates.forEach(update => {
            const changeEmoji = update.change24h >= 0 ? '📈' : '📉';
            const recentChangeEmoji = update.priceChange >= 0 ? '🟢' : '🔴';
            
            embed.addFields({
                name: `${update.symbol} ${recentChangeEmoji}`,
                value: `💰 $${update.price.toLocaleString()}\n` +
                      `${changeEmoji} 24h: ${update.changePercent24h.toFixed(2)}%\n` +
                      `📊 Vol: $${Math.round(update.volume24h).toLocaleString()}`,
                inline: true
            });
        });

        return embed;
    }

    createEmbeds(updates) {
        const embeds = [];
        
        // Split updates into chunks of 25
        for (let i = 0; i < updates.length; i += FIELDS_PER_EMBED) {
            const chunk = updates.slice(i, i + FIELDS_PER_EMBED);
            const embed = new EmbedBuilder()
                .setTitle(`🚀 Live Crypto Price Tracker ${embeds.length + 1}/${Math.ceil(updates.length / FIELDS_PER_EMBED)}`)
                .setColor('#0099ff')
                .setTimestamp();

            if (chunk.length === 0) {
                embed.setDescription('No cryptocurrencies currently tracked');
            } else {
                chunk.forEach(update => {
                    const changeEmoji = update.change24h >= 0 ? '📈' : '📉';
                    const recentChangeEmoji = update.priceChange >= 0 ? '🟢' : '🔴';
                    
                    embed.addFields({
                        name: `${update.symbol} ${recentChangeEmoji}`,
                        value: `💰 $${update.price.toLocaleString()}\n` +
                              `${changeEmoji} 24h: ${update.changePercent24h.toFixed(2)}%\n` +
                              `📊 Vol: $${Math.round(update.volume24h).toLocaleString()}`,
                        inline: true
                    });
                });
            }
            embeds.push(embed);
        }

        return embeds;
    }

    async updateMessage(updates) {
        if (this.trackingMessage) {
            try {
                await this.trackingMessage.edit({
                    embeds: this.createEmbeds(updates)
                });
            } catch (error) {
                console.error('Error updating tracking message:', error);
            }
        }
    }

    async startTracking(symbols) {
        // Ensure we don't exceed the maximum number of tracked coins
        const validSymbols = symbols.slice(0, MAX_TRACKED_COINS);
        
        // Add symbols to tracked coins
        validSymbols.forEach(symbol => {
            this.trackedCoins.set(symbol.toUpperCase(), true);
        });

        // Start the update interval if not already running
        if (!this.updateInterval) {
            await this.updatePrices();
            this.updateInterval = setInterval(() => this.updatePrices(), UPDATE_INTERVAL);
        }

        // Save the updated tracking list
        await this.saveTrackedCoins();
    }

    async stopTracking(symbols) {
        if (!symbols) {
            // Stop tracking all coins
            this.trackedCoins.clear();
            this.lastPrices.clear();
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
        } else {
            // Stop tracking specific coins
            symbols.forEach(symbol => {
                this.trackedCoins.delete(symbol.toUpperCase());
                this.lastPrices.delete(symbol.toUpperCase());
            });

            // If no coins are being tracked, stop the interval
            if (this.trackedCoins.size === 0 && this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
        }

        // Save the updated tracking list
        await this.saveTrackedCoins();
    }

    async updatePrices() {
        try {
            if (this.trackedCoins.size === 0) {
                await this.updateMessage([]);
                return;
            }

            const symbols = Array.from(this.trackedCoins.keys()).join(',');
            const response = await axios.get(
                `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbols}&tsyms=USD&api_key=${CRYPTOCOMPARE_API_KEY}`
            );

            const { RAW } = response.data;
            const updates = [];

            for (const symbol in RAW) {
                const data = RAW[symbol].USD;
                const lastPrice = this.lastPrices.get(symbol);
                const currentPrice = data.PRICE;
                
                // Calculate price change
                const priceChange = lastPrice ? ((currentPrice - lastPrice) / lastPrice) * 100 : 0;
                
                // Store new price
                this.lastPrices.set(symbol, currentPrice);

                updates.push({
                    symbol,
                    price: currentPrice,
                    change24h: data.CHANGE24HOUR,
                    changePercent24h: data.CHANGEPCT24HOUR,
                    priceChange,
                    volume24h: data.VOLUME24HOUR,
                    lastUpdate: new Date(data.LASTUPDATE * 1000).toLocaleString()
                });
            }

            await this.updateMessage(updates);
        } catch (error) {
            console.error('Error updating crypto prices:', error);
            this.emit('error', error);
        }
    }

    getTrackedCoins() {
        return Array.from(this.trackedCoins.keys());
    }
}

export const cryptoTracker = new CryptoTrackerService(); 