import { EventEmitter } from 'events';
import { EmbedBuilder } from 'discord.js';
import { twelveDataService } from './twelveDataService.js';

const TRACKED_STOCKS = ['AAPL', 'TSLA', 'NVDA'];

class StockTrackerService extends EventEmitter {
    constructor() {
        super();
        this.trackedStocks = new Set(TRACKED_STOCKS);
        this.lastPrices = new Map();
        this.trackingMessage = null;
        this.channel = null;
    }

    async initializeChannel(client) {
        try {
            this.channel = await client.channels.fetch('1317039575742287953');
            const messages = await this.channel.messages.fetch({ limit: 1 });
            this.trackingMessage = messages.first();
            
            if (!this.trackingMessage) {
                // Create a single initial embed
                const embed = new EmbedBuilder()
                    .setColor('#2F3136')
                    .setTitle('📊 Market Data')
                    .setDescription('Loading market data...')
                    .setFooter({ 
                        text: '💎 Updated every 4 hours • Today at ' + new Date().toLocaleTimeString()
                    });

                this.trackingMessage = await this.channel.send({
                    embeds: [embed]
                });
            }

            // Start tracking
            twelveDataService.on('marketData', (data) => this.handleMarketData(data));
            await twelveDataService.startTracking(Array.from(this.trackedStocks));
            console.log('Market data tracker initialized with:', Array.from(this.trackedStocks).join(', '));
        } catch (error) {
            console.error('Error initializing market data tracker channel:', error);
        }
    }

    handleMarketData(data) {
        this.lastPrices.set(data.symbol, data);

        const updates = Array.from(this.trackedStocks).map(symbol => {
            return this.lastPrices.get(symbol) || {
                symbol,
                price: null,
                open: null,
                high: null,
                low: null,
                volume: null,
                previousClose: null,
                percentChange: null,
                rsi: null,
                sma50: null
            };
        });

        this.updateMessage(updates);
    }

    createEmbed(updates) {
        // Create an array to hold our embeds
        const embeds = updates.map(update => {
            const embed = new EmbedBuilder()
                .setColor('#2F3136');

            if (!update.price) {
                embed.setDescription(`Loading data for ${update.symbol}...`);
                return embed;
            }

            // Set the logo as thumbnail if available
            if (update.logo) {
                embed.setThumbnail(update.logo);
            }

            // Format the data in a clean way
            const stockInfo = [
                `**${update.symbol}**`,
                '',
                `O: $${update.open.toFixed(2)} | H: $${update.high.toFixed(2)} | L: $${update.low.toFixed(2)} | C: $${update.price.toFixed(2)}`,
                `Prev Close: $${update.previousClose.toFixed(2)}`,
                '',
                `52W Range: $${update.fiftyTwoWeekLow?.toFixed(2)} - $${update.fiftyTwoWeekHigh?.toFixed(2)}`,
                `Vol: ${(update.volume/1e6).toFixed(2)}M | Avg Vol: ${(update.averageVolume/1e6).toFixed(2)}M`,
                `Market: ${update.isMarketOpen ? '🟢 Open' : '🔴 Closed'}`,
                '',
                `1D: ${update.percentChange >= 0 ? '+' : ''}${update.percentChange?.toFixed(2)}% | ` +
                `1W: ${update.weeklyChange >= 0 ? '+' : ''}${update.weeklyChange?.toFixed(2)}% | ` +
                `1M: ${update.monthlyChange >= 0 ? '+' : ''}${update.monthlyChange?.toFixed(2)}%`
            ].join('\n');

            embed.setDescription(stockInfo);
            return embed;
        });

        // Add footer to last embed
        if (embeds.length > 0) {
            embeds[embeds.length - 1].setFooter({
                text: '💎 Updated every 4 hours • Today at ' + new Date().toLocaleTimeString()
            });
        }

        return embeds;
    }

    async updateMessage(updates) {
        if (this.trackingMessage) {
            try {
                const embeds = this.createEmbed(updates);
                await this.trackingMessage.edit({ embeds });
            } catch (error) {
                console.error('Error updating tracking message:', error.message);
                // If we get an API error, log more details
                if (error.code) {
                    console.error('Discord API Error:', {
                        code: error.code,
                        message: error.message,
                        status: error.status
                    });
                }
            }
        }
    }
}

export const stockTracker = new StockTrackerService(); 