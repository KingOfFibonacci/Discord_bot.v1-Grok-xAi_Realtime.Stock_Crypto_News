import { EventEmitter } from 'events';
import axios from 'axios';
import dotenv from 'dotenv';
import { API } from '../../config/constants.js';
import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import { DISCORD } from '../../config/settings.js';
import { cryptoAlertService } from '../alerts/cryptoalerts/cryptoAlertService.js';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const CRYPTOCOMPARE_API_KEY = process.env.CRYPTOCOMPARE_API_KEY;
const UPDATE_INTERVAL = 30000; // 30 seconds between updates
const TRACKED_COINS_PATH = path.join(process.cwd(), 'src', 'data', 'trackedCoins.json');

class CryptoTrackerService extends EventEmitter {
    constructor() {
        super();
        this.trackedCoins = new Map();
        this.lastPrices = new Map();
        this.updateInterval = null;
        this.category = null;
        this.channelData = new Map();
        this.coinNames = new Map(); // Store full names of coins
    }

    async loadTrackedCoins() {
        try {
            const data = await fs.readFile(TRACKED_COINS_PATH, 'utf8');
            const { trackedSymbols } = JSON.parse(data);
            trackedSymbols.forEach(symbol => {
                this.trackedCoins.set(symbol.toUpperCase(), true);
            });
            console.log(`Loaded ${this.trackedCoins.size} tracked coins:`, Array.from(this.trackedCoins.keys()));
        } catch (error) {
            console.error('Error loading tracked coins:', error);
        }
    }

    async initializeChannel(client) {
        try {
            // Fetch the category channel
            const category = await client.channels.fetch(DISCORD.CRYPTO_TRACKER_CHANNEL_ID);
            if (!category) {
                throw new Error('Could not find the crypto tracker category');
            }

            this.category = category;
            console.log('Successfully connected to crypto tracker category');

            // Load tracked coins
            await this.loadTrackedCoins();
            
            // Initialize channels for each coin
            await this.initializeChannels();

            // Start tracking with loaded coins
            if (this.trackedCoins.size > 0) {
                const symbols = Array.from(this.trackedCoins.keys());
                await this.startTracking(symbols);
            }
        } catch (error) {
            console.error('Error initializing crypto tracker category:', error);
            throw error;
        }
    }

    formatChannelName(symbol, fullName) {
        // Convert full name to lowercase and remove special characters
        return fullName.toLowerCase()
            .replace(/[^\w\s-]/g, '')  // Remove special characters except hyphen
            .replace(/\s+/g, '-')      // Replace spaces with hyphens
            .slice(0, 100);            // Discord has a channel name length limit
    }

    async loadCoinNames(symbols) {
        try {
            const response = await axios.get(
                `${API.CRYPTOCOMPARE.BASE_URL}/coin/generalinfo?fsyms=${symbols.join(',')}&tsym=USD&api_key=${CRYPTOCOMPARE_API_KEY}`
            );
            
            const { Data } = response.data;
            if (!Data) return;

            Data.forEach(coin => {
                if (coin.CoinInfo?.FullName) {
                    this.coinNames.set(coin.CoinInfo.Name, coin.CoinInfo.FullName);
                }
            });
            
            console.log('Loaded full names for coins:', 
                Array.from(this.coinNames.entries())
                    .map(([symbol, name]) => `${symbol}: ${name}`)
                    .join(', ')
            );
        } catch (error) {
            console.error('Error loading coin names:', error);
        }
    }

    async initializeChannels() {
        try {
            console.log('Starting channel initialization...');
            const existingChannels = await this.category.guild.channels.fetch();
            const categoryChannels = existingChannels.filter(channel => 
                channel.parentId === this.category.id
            );
            console.log(`Found ${categoryChannels.size} existing channels in category`);
            
            const symbols = Array.from(this.trackedCoins.keys());
            console.log(`Initializing channels for ${symbols.length} coins:`, symbols);

            // Load full names for all coins first
            await this.loadCoinNames(symbols);

            // Split symbols into chunks of 20 for API calls
            const chunkSize = 20;
            for (let i = 0; i < symbols.length; i += chunkSize) {
                const symbolsChunk = symbols.slice(i, i + chunkSize);
                console.log(`Processing chunk ${i/chunkSize + 1}:`, symbolsChunk);

                const priceResponse = await axios.get(
                    `${API.CRYPTOCOMPARE.BASE_URL}/pricemultifull?fsyms=${symbolsChunk.join(',')}&tsyms=USD&api_key=${CRYPTOCOMPARE_API_KEY}`
                );
                const { RAW } = priceResponse.data;
                
                for (const symbol of symbolsChunk) {
                    console.log(`Creating/updating channel for ${symbol}...`);
                    const priceData = RAW[symbol]?.USD;
                    if (!priceData) {
                        console.warn(`No price data available for ${symbol}, skipping...`);
                        continue;
                    }

                    try {
                        // Create initial data object
                        const initialData = {
                            symbol,
                            price: priceData.PRICE,
                            change24h: priceData.CHANGE24HOUR,
                            changePercent24h: priceData.CHANGEPCT24HOUR,
                            volume24h: priceData.VOLUME24HOUR,
                            lastUpdate: new Date(priceData.LASTUPDATE * 1000).toLocaleString(),
                            logo: `https://www.cryptocompare.com${priceData.IMAGEURL}`
                        };

                        // Use full name for channel name, fallback to symbol if not found
                        const fullName = this.coinNames.get(symbol) || symbol;
                        const channelName = this.formatChannelName(symbol, fullName);
                        let channel = categoryChannels.find(c => c.name === channelName);

                        if (!channel) {
                            // Create new channel with proper permissions
                            channel = await this.category.guild.channels.create({
                                name: channelName,
                                type: ChannelType.GuildText,
                                parent: this.category.id,
                                permissionOverwrites: [
                                    {
                                        id: this.category.guild.roles.everyone.id,
                                        deny: [PermissionFlagsBits.SendMessages],
                                        allow: [PermissionFlagsBits.ViewChannel]
                                    }
                                ]
                            });

                            // Send initial message and pin it
                            const message = await channel.send({
                                content: `Price tracking for ${fullName} (${symbol})`,
                                embeds: [this.createCoinEmbed(symbol, initialData)]
                            });
                            await message.pin();

                            // Store channel and message data
                            this.channelData.set(symbol, {
                                channelId: channel.id,
                                messageId: message.id,
                                isPinned: true
                            });

                            console.log(`Created new channel for ${fullName} (${symbol}): ${channel.id}`);
                        } else {
                            const messages = await channel.messages.fetch({ limit: 1 });
                            const message = messages.first();
                            
                            if (message) {
                                await message.edit({
                                    content: `Price tracking for ${fullName} (${symbol})`,
                                    embeds: [this.createCoinEmbed(symbol, initialData)]
                                });
                                
                                // Ensure message is pinned
                                if (!message.pinned) {
                                    await message.pin();
                                }
                                
                                this.channelData.set(symbol, {
                                    channelId: channel.id,
                                    messageId: message.id,
                                    isPinned: true
                                });
                            }
                            console.log(`Updated existing channel for ${fullName} (${symbol}): ${channel.id}`);
                        }
                    } catch (error) {
                        console.error(`Error setting up channel for ${symbol}:`, error);
                    }
                }

                if (i + chunkSize < symbols.length) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            
            console.log('Channel initialization complete!');
            console.log(`Successfully created/updated ${this.channelData.size} channels`);
        } catch (error) {
            console.error('Error initializing channels:', error);
        }
    }

    createSubscribeButton() {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('subscribe_alerts')
                    .setLabel('Subscribe to Price Alerts')
                    .setStyle(ButtonStyle.Primary)
            );
        return row;
    }

    async handleSubscription(interaction) {
        const userId = interaction.user.id;
        const symbol = interaction.message.embeds[0].title.split(' ')[0];
        
        // Get all targets for the symbol
        const targets = cryptoAlertService.getTargets(symbol);
        
        // Subscribe user to all targets for this symbol
        let subscribed = false;
        for (const target of targets) {
            if (await cryptoAlertService.subscribe(userId, symbol, target.price, target.direction)) {
                subscribed = true;
            }
        }
        
        await interaction.reply({ 
            content: subscribed ? 
                `You've been subscribed to price alerts for ${symbol}!` : 
                `No price targets found for ${symbol}. Please set up targets first.`,
            ephemeral: true 
        });
    }

    createCoinEmbed(symbol, data = null) {
        const embed = new EmbedBuilder()
            .setTitle(`${symbol} Price Analysis`)
            .setColor(data?.changePercent24h >= 0 ? '#00ff88' : '#ff0055');

        if (data) {
            if (data.logo) {
                embed.setThumbnail(data.logo);
            }

            // Format price with appropriate decimal places based on value
            const formatPrice = (price) => {
                if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                if (price >= 1) return price.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
                return price.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 });
            };

            // Format volume with K/M/B suffix
            const formatVolume = (vol) => {
                if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
                if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
                if (vol >= 1e3) return `$${(vol / 1e3).toFixed(2)}K`;
                return `$${vol.toFixed(2)}`;
            };

            // Price and change field
            embed.addFields({
                name: '💰 Current Price',
                value: `$${formatPrice(data.price)}`,
                inline: true
            });

            // 24h change with emoji
            const changeEmoji = data.changePercent24h >= 0 ? '📈' : '📉';
            embed.addFields({
                name: '24h Change',
                value: `${changeEmoji} ${data.changePercent24h.toFixed(2)}%`,
                inline: true
            });

            // Volume
            embed.addFields({
                name: '📊 24h Volume',
                value: formatVolume(data.volume24h),
                inline: true
            });

            // Add price targets if they exist
            const targets = cryptoAlertService.getTargets(symbol);
            if (targets.length > 0) {
                const targetsText = targets.map(t => {
                    const emoji = t.direction === 'above' ? '⬆️' : '⬇️';
                    const status = t.triggered ? '✅' : '⏳';
                    return `${emoji} $${formatPrice(t.price)} ${status}`;
                }).join('\n');
                
                embed.addFields({
                    name: '🎯 Price Targets',
                    value: targetsText,
                    inline: false
                });
            }

            // Add timestamp
            embed.setFooter({ 
                text: `Last Updated: ${new Date().toLocaleTimeString()}`
            });
            embed.setTimestamp();
        }

        return embed;
    }

    async updatePrices() {
        try {
            if (this.trackedCoins.size === 0) return;

            // Fetch all prices at once
            const symbols = Array.from(this.trackedCoins.keys()).join(',');
            const response = await axios.get(
                `${API.CRYPTOCOMPARE.BASE_URL}/pricemultifull?fsyms=${symbols}&tsyms=USD&api_key=${CRYPTOCOMPARE_API_KEY}`
            );

            const { RAW } = response.data;
            const updates = [];

            // Prepare all updates
            for (const symbol in RAW) {
                const data = RAW[symbol].USD;
                updates.push({
                    symbol,
                    price: data.PRICE,
                    change24h: data.CHANGE24HOUR,
                    changePercent24h: data.CHANGEPCT24HOUR,
                    volume24h: data.VOLUME24HOUR,
                    lastUpdate: new Date(data.LASTUPDATE * 1000).toLocaleString(),
                    logo: `https://www.cryptocompare.com${data.IMAGEURL}`
                });
            }

            // Update all messages
            await Promise.all(updates.map(async (update) => {
                try {
                    const channelData = this.channelData.get(update.symbol);
                    if (!channelData) return;

                    // Fetch the channel using the guild's channels collection
                    const channel = await this.category.guild.channels.fetch(channelData.channelId);
                    if (!channel) return;

                    // Update embed message and ensure it's pinned
                    const message = await channel.messages.fetch(channelData.messageId);
                    if (message) {
                        const fullName = this.coinNames.get(update.symbol) || update.symbol;
                        const embed = this.createCoinEmbed(update.symbol, update);
                        await message.edit({
                            content: `Price tracking for ${fullName} (${update.symbol})`,
                            embeds: [embed]
                        });

                        // Ensure message stays pinned
                        if (!message.pinned) {
                            await message.pin();
                            this.channelData.get(update.symbol).isPinned = true;
                        }
                    }
                } catch (error) {
                    console.error(`Error updating ${update.symbol}:`, error);
                }
            }));
        } catch (error) {
            console.error('Error updating crypto prices:', error);
            this.emit('error', error);
        }
    }

    async updateMessage(updates) {
        // Remove this method as we're not using a tracking message in forum channels
        return;
    }

    createEmbeds(updates) {
        const embeds = [];
        
        // Overview embed
        const overviewEmbed = new EmbedBuilder()
            .setTitle('🚀 Crypto Watchlist')
            .setColor('#00ff88')
            .setTimestamp();

        if (updates.length === 0) {
            overviewEmbed.setDescription('No cryptocurrencies currently tracked');
            return [overviewEmbed];
        }

        // Add coins to overview
        updates.forEach(update => {
            const changeEmoji = update.change24h >= 0 ? '📈' : '📉';
            const recentChangeEmoji = update.priceChange >= 0 ? '🟢' : '🔴';
            
            overviewEmbed.addFields({
                name: `${update.symbol} ${recentChangeEmoji}`,
                value: `💰 $${update.price.toLocaleString()}\n` +
                       `${changeEmoji} 24h: ${update.changePercent24h.toFixed(2)}%\n` +
                       `📊 Vol: $${Math.round(update.volume24h).toLocaleString()}`,
                inline: true
            });

            if (update.logo) {
                overviewEmbed.setThumbnail(update.logo);
            }
        });

        embeds.push(overviewEmbed);
        return embeds;
    }

    async startTracking(symbols) {
        const validSymbols = symbols.slice(0, 50);
        
        validSymbols.forEach(symbol => {
            this.trackedCoins.set(symbol.toUpperCase(), true);
        });

        // Clear any existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        // Start a new update interval with longer delay to avoid rate limits
        await this.updatePrices();
        this.updateInterval = setInterval(async () => {
            console.log('Running scheduled price update...');
            try {
                await this.updatePrices();
                console.log('Scheduled price update completed successfully');
            } catch (error) {
                console.error('Error in scheduled price update:', error);
            }
        }, UPDATE_INTERVAL);
        console.log('Started new price update interval');
    }

    async stopTracking(symbols) {
        if (!symbols) {
            this.trackedCoins.clear();
            this.lastPrices.clear();
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
                console.log('Cleared all tracking and stopped update interval');
            }
        } else {
            symbols.forEach(symbol => {
                this.trackedCoins.delete(symbol.toUpperCase());
                this.lastPrices.delete(symbol.toUpperCase());
            });

            if (this.trackedCoins.size === 0 && this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
                console.log('No more coins to track, stopped update interval');
            }
        }
    }

    getTrackedCoins() {
        return Array.from(this.trackedCoins.keys());
    }
}

export const cryptoTracker = new CryptoTrackerService(); 