import axios from 'axios';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import dotenv from 'dotenv';
import { API } from '../../config/constants.js';

dotenv.config();

// Update the interval to stay within daily limits
// 800 requests per day = 1 request every 108 seconds
const OPTIMAL_INTERVAL = 108000; // 108 seconds in milliseconds

class TwelveDataService extends EventEmitter {
    constructor() {
        super();
        this.apiKey = process.env.TWELVEDATA_API_KEY;
        this.baseUrl = API.TWELVEDATA.BASE_URL;
        this.updateInterval = null;
        this.activeSymbols = new Set();
        this.lastKnownPrices = new Map();
        this.requestCount = 0;
        this.lastRequestTime = null;
    }

    async startTracking(symbols) {
        if (symbols.length > 8) {
            throw new Error('Free plan limited to 8 concurrent connections');
        }

        symbols.forEach(symbol => this.activeSymbols.add(symbol));
        
        await this.updatePrices();
        
        if (!this.updateInterval) {
            this.updateInterval = setInterval(() => this.updatePrices(), OPTIMAL_INTERVAL);
            console.log(`Polling every ${OPTIMAL_INTERVAL/1000} seconds to stay within rate limits`);
        }
    }

    async updatePrices() {
        try {
            if (this.activeSymbols.size === 0) return;

            const symbols = Array.from(this.activeSymbols).join(',');
            const response = await axios.get(
                `${this.baseUrl}/quote?symbol=${symbols}&apikey=${this.apiKey}`
            );

            if (response.data) {
                const updates = Array.isArray(response.data) ? response.data : [response.data];
                
                updates.forEach(data => {
                    const timestamp = new Date(data.timestamp).getTime();
                    const now = Date.now();
                    const isStale = now - timestamp > 5 * 60 * 1000;

                    if (!isStale) {
                        this.lastKnownPrices.set(data.symbol, {
                            price: parseFloat(data.close),
                            volume: parseInt(data.volume),
                            timestamp: timestamp
                        });
                    }

                    const lastKnown = this.lastKnownPrices.get(data.symbol);
                    if (lastKnown) {
                        this.emit('price', {
                            event: 'price',
                            symbol: data.symbol,
                            price: lastKnown.price,
                            day_volume: lastKnown.volume,
                            timestamp: lastKnown.timestamp / 1000,
                            marketClosed: isStale
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching stock prices:', error);
            
            Array.from(this.activeSymbols).forEach(symbol => {
                const lastKnown = this.lastKnownPrices.get(symbol);
                if (lastKnown) {
                    this.emit('price', {
                        event: 'price',
                        symbol: symbol,
                        price: lastKnown.price,
                        day_volume: lastKnown.volume,
                        timestamp: lastKnown.timestamp / 1000,
                        marketClosed: true
                    });
                }
            });
        }
    }

    stopTracking() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.activeSymbols.clear();
    }
}

export const twelveDataService = new TwelveDataService(); 