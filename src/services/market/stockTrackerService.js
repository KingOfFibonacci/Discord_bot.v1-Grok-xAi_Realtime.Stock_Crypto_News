import { EventEmitter } from 'events';
import { EmbedBuilder } from 'discord.js';
import { DISCORD } from '../../config/settings.js';
import { twelveDataService } from './twelveDataService.js';

const TRACKED_STOCKS = ['AAPL', 'TSLA', 'AMZN', 'META', 'NVDA', 'GOOGL', 'AMC', 'GME'];

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
                this.trackingMessage = await this.channel.send({
                    embeds: [this.createEmbed([])]
                });
            }

            // Start tracking with polling
            twelveDataService.on('price', (data) => this.handlePriceUpdate(data));
            await twelveDataService.startTracking(Array.from(this.trackedStocks));
            console.log('Stock tracker initialized with:', Array.from(this.trackedStocks).join(', '));
        } catch (error) {
            console.error('Error initializing stock tracker channel:', error);
        }
    }

    handlePriceUpdate(data) {
        const lastPrice = this.lastPrices.get(data.symbol);
        const priceChange = lastPrice ? ((data.price - lastPrice) / lastPrice) * 100 : 0;
        this.lastPrices.set(data.symbol, data.price);

        const updates = Array.from(this.trackedStocks).map(symbol => ({
            symbol,
            price: data.price,
            dayVolume: data.day_volume,
            timestamp: data.timestamp,
            priceChange
        }));

        this.updateMessage(updates);
    }

    createEmbed(updates) {
        const embed = new EmbedBuilder()
            .setTitle('📊 Live Stock Market Tracker')
            .setColor('#00ff88')
            .setFooter({ 
                text: '💎 Premium Market Intelligence • ' + 
                      (updates[0]?.marketClosed ? 'Market Closed - Last Known Prices' : 'Real-time Updates')
            })
            .setTimestamp();

        // Market Overview Section
        let totalVolume = 0;
        let gainers = 0;
        let losers = 0;

        updates.forEach(update => {
            totalVolume += update.dayVolume || 0;
            if (update.priceChange >= 0) gainers++; else losers++;
        });

        embed.addFields({
            name: '📈 Market Overview',
            value: `Trading Volume: ${(totalVolume/1e6).toFixed(2)}M\n` +
                   `Gainers: ${gainers} 📈 | Losers: ${losers} 📉\n` +
                   `Last Update: ${new Date().toLocaleTimeString()}`,
            inline: false
        });

        // Add stock price fields
        updates.forEach(update => {
            const changeEmoji = update.priceChange >= 0 ? '🟢' : '🔴';
            const volumeFormatted = update.dayVolume > 1e6 
                ? `${(update.dayVolume/1e6).toFixed(2)}M`
                : update.dayVolume?.toLocaleString();

            embed.addFields({
                name: `${changeEmoji} ${update.symbol}`,
                value: `💰 $${update.price?.toLocaleString()}\n` +
                       `📊 Change: ${update.priceChange?.toFixed(2)}%\n` +
                       `📈 Vol: ${volumeFormatted || 'N/A'}`,
                inline: true
            });
        });

        return embed;
    }

    async updateMessage(updates) {
        if (this.trackingMessage) {
            try {
                await this.trackingMessage.edit({
                    embeds: [this.createEmbed(updates)]
                });
            } catch (error) {
                console.error('Error updating tracking message:', error);
            }
        }
    }
}

export const stockTracker = new StockTrackerService(); 