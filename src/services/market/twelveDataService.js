import axios from 'axios';
import { EventEmitter } from 'events';
import dotenv from 'dotenv';
import { API } from '../../config/constants.js';

dotenv.config();

// Update once per market session
const UPDATE_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

class TwelveDataService extends EventEmitter {
    constructor() {
        super();
        this.apiKey = process.env.TWELVEDATA_API_KEY;
        this.baseUrl = API.TWELVEDATA.BASE_URL;
        this.updateInterval = null;
        this.activeSymbols = new Set();
        this.lastKnownPrices = new Map();
        this.requestCount = 0;
        this.lastMinute = Date.now();
    }

    async startTracking(symbols) {
        if (symbols.length > 8) {
            throw new Error('Free plan limited to 8 concurrent connections');
        }

        symbols.forEach(symbol => this.activeSymbols.add(symbol));
        
        await this.updateStockData();
        
        if (!this.updateInterval) {
            this.updateInterval = setInterval(() => this.updateStockData(), UPDATE_INTERVAL);
            console.log(`Updating market data every ${UPDATE_INTERVAL/1000/60/60} hours`);
        }
    }

    async updateStockData() {
        try {
            if (this.activeSymbols.size === 0) return;

            // Reset request count every minute
            const now = Date.now();
            if (now - this.lastMinute >= 60000) {
                this.requestCount = 0;
                this.lastMinute = now;
            }

            for (const symbol of this.activeSymbols) {
                try {
                    // Check rate limit
                    if (this.requestCount >= 8) {
                        console.log('Rate limit reached, waiting for next minute...');
                        await new Promise(resolve => setTimeout(resolve, 60000 - (Date.now() - this.lastMinute)));
                        this.requestCount = 0;
                        this.lastMinute = Date.now();
                    }

                    // Get daily summary
                    const response = await axios.get(
                        `${this.baseUrl}/quote?symbol=${symbol}&apikey=${this.apiKey}`
                    );
                    this.requestCount++;

                    // Get logo
                    const logoResponse = await axios.get(
                        `${this.baseUrl}/logo?symbol=${symbol}&apikey=${this.apiKey}`
                    );
                    this.requestCount++;

                    // Get weekly change
                    const weeklyResponse = await axios.get(
                        `${this.baseUrl}/time_series?symbol=${symbol}&interval=1week&outputsize=2&apikey=${this.apiKey}`
                    );
                    this.requestCount++;

                    // Get monthly change
                    const monthlyResponse = await axios.get(
                        `${this.baseUrl}/time_series?symbol=${symbol}&interval=1month&outputsize=2&apikey=${this.apiKey}`
                    );
                    this.requestCount++;

                    if (response.data) {
                        const quote = response.data;
                        const logo = logoResponse.data?.url || null;
                        
                        // Calculate weekly change
                        const weeklyData = weeklyResponse.data?.values;
                        const weeklyChange = weeklyData && weeklyData.length >= 2 ? 
                            ((parseFloat(weeklyData[0].close) - parseFloat(weeklyData[1].close)) / parseFloat(weeklyData[1].close)) * 100 : null;

                        // Calculate monthly change
                        const monthlyData = monthlyResponse.data?.values;
                        const monthlyChange = monthlyData && monthlyData.length >= 2 ? 
                            ((parseFloat(monthlyData[0].close) - parseFloat(monthlyData[1].close)) / parseFloat(monthlyData[1].close)) * 100 : null;

                        const stockData = {
                            symbol,
                            logo,
                            price: parseFloat(quote.close),
                            open: parseFloat(quote.open),
                            high: parseFloat(quote.high),
                            low: parseFloat(quote.low),
                            volume: parseInt(quote.volume),
                            previousClose: parseFloat(quote.previous_close),
                            percentChange: parseFloat(quote.percent_change),
                            weeklyChange: weeklyChange,
                            monthlyChange: monthlyChange,
                            fiftyTwoWeekHigh: parseFloat(quote.fifty_two_week?.high) || null,
                            fiftyTwoWeekLow: parseFloat(quote.fifty_two_week?.low) || null,
                            averageVolume: parseInt(quote.average_volume) || null,
                            isMarketOpen: quote.is_market_open === "1",
                            timestamp: new Date(quote.timestamp).getTime()
                        };

                        this.lastKnownPrices.set(symbol, stockData);
                        this.emit('marketData', stockData);

                        // Wait 15 seconds between symbols to respect rate limits
                        if (symbol !== Array.from(this.activeSymbols).pop()) {
                            await new Promise(resolve => setTimeout(resolve, 15000));
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching data for ${symbol}:`, error.response?.data?.message || error.message);
                }
            }
        } catch (error) {
            console.error('Error updating market data:', error);
            this.emitLastKnownData();
        }
    }

    emitLastKnownData() {
        Array.from(this.activeSymbols).forEach(symbol => {
            const lastKnown = this.lastKnownPrices.get(symbol);
            if (lastKnown) {
                this.emit('marketData', lastKnown);
            }
        });
    }

    stopTracking() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.activeSymbols.clear();
        this.requestCount = 0;
    }
}

export const twelveDataService = new TwelveDataService(); 