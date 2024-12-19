import { EventEmitter } from 'events';
import fs from 'fs/promises';
import { watch } from 'fs';
import path from 'path';

const PRICE_TARGETS_PATH = path.join(process.cwd(), 'src', 'data', 'priceTargets.json');

class CryptoAlertService extends EventEmitter {
    constructor() {
        super();
        this.priceTargets = new Map();
        this.subscribers = new Map();
        this.watchPriceTargetsFile();
    }

    watchPriceTargetsFile() {
        const watcher = watch(path.dirname(PRICE_TARGETS_PATH), (eventType, filename) => {
            if (filename === 'priceTargets.json') {
                console.log('Price targets file changed, reloading...');
                this.loadPriceTargets();
                this.emit('targetsUpdated');
            }
        });

        process.on('SIGINT', () => {
            watcher.close();
            process.exit(0);
        });
    }

    async loadPriceTargets() {
        try {
            const data = await fs.readFile(PRICE_TARGETS_PATH, 'utf8');
            this.priceTargets = new Map(Object.entries(JSON.parse(data)));
            console.log('Price targets loaded:', this.priceTargets);
        } catch (error) {
            console.error('Error loading price targets:', error);
            this.priceTargets = new Map();
        }
    }

    async savePriceTargets() {
        try {
            const data = Object.fromEntries(this.priceTargets);
            await fs.writeFile(PRICE_TARGETS_PATH, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error saving price targets:', error);
        }
    }

    async addPriceTarget(symbol, price, direction = 'above') {
        if (!this.priceTargets.has(symbol)) {
            this.priceTargets.set(symbol, { targets: [] });
        }

        const coinTargets = this.priceTargets.get(symbol);
        coinTargets.targets.push({
            price: parseFloat(price),
            direction,
            triggered: false,
            subscribers: []
        });

        await this.savePriceTargets();
        return true;
    }

    async removePriceTarget(symbol, price, direction) {
        if (!this.priceTargets.has(symbol)) return false;

        const coinTargets = this.priceTargets.get(symbol);
        const targetIndex = coinTargets.targets.findIndex(
            t => t.price === price && t.direction === direction
        );

        if (targetIndex === -1) return false;

        coinTargets.targets.splice(targetIndex, 1);
        if (coinTargets.targets.length === 0) {
            this.priceTargets.delete(symbol);
        }

        await this.savePriceTargets();
        return true;
    }

    async subscribe(userId, symbol, price, direction) {
        if (!this.priceTargets.has(symbol)) return false;

        const coinTargets = this.priceTargets.get(symbol);
        const target = coinTargets.targets.find(
            t => t.price === price && t.direction === direction
        );

        if (!target) return false;

        if (!target.subscribers.includes(userId)) {
            target.subscribers.push(userId);
            await this.savePriceTargets();
        }

        return true;
    }

    async unsubscribe(userId, symbol, price, direction) {
        if (!this.priceTargets.has(symbol)) return false;

        const coinTargets = this.priceTargets.get(symbol);
        const target = coinTargets.targets.find(
            t => t.price === price && t.direction === direction
        );

        if (!target) return false;

        const index = target.subscribers.indexOf(userId);
        if (index !== -1) {
            target.subscribers.splice(index, 1);
            await this.savePriceTargets();
        }

        return true;
    }

    async checkPriceTargets(symbol, currentPrice) {
        if (!this.priceTargets.has(symbol)) return [];

        const alerts = [];
        const targets = this.priceTargets.get(symbol).targets;

        for (const target of targets) {
            if (!target.triggered) {
                const isTriggered = target.direction === 'above' ? 
                    currentPrice >= target.price : 
                    currentPrice <= target.price;

                if (isTriggered) {
                    target.triggered = true;
                    alerts.push({
                        symbol,
                        target,
                        currentPrice
                    });
                }
            }
        }

        if (alerts.length > 0) {
            await this.savePriceTargets();
        }

        return alerts;
    }

    async resetTriggers(symbol) {
        if (!this.priceTargets.has(symbol)) return;

        const coinTargets = this.priceTargets.get(symbol);
        coinTargets.targets.forEach(target => {
            target.triggered = false;
        });

        await this.savePriceTargets();
    }

    getTargets(symbol) {
        return this.priceTargets.get(symbol)?.targets || [];
    }

    getAllTargets() {
        const allTargets = {};
        for (const [symbol, data] of this.priceTargets) {
            allTargets[symbol] = data.targets;
        }
        return allTargets;
    }
}

export const cryptoAlertService = new CryptoAlertService(); 