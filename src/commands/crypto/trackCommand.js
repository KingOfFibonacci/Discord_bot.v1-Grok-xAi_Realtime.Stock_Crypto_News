import { cryptoTracker } from '../../services/crypto/cryptoTrackerService.js';

export const trackCommand = async (messageContent, message) => {
    const args = messageContent.split(' ');
    const subCommand = args[1]?.toLowerCase();
    const symbols = args.slice(2).map(s => s.toUpperCase());

    switch (subCommand) {
        case 'start':
            if (!symbols.length) {
                return "Please provide crypto symbols to track. Example: !track start BTC ETH DOGE";
            }
            await cryptoTracker.startTracking(symbols);
            return `Now tracking: ${symbols.join(', ')}`;

        case 'stop':
            cryptoTracker.stopTracking(symbols.length ? symbols : null);
            return symbols.length ? 
                `Stopped tracking: ${symbols.join(', ')}` : 
                'Stopped tracking all cryptocurrencies';

        case 'list':
            const trackedCoins = cryptoTracker.getTrackedCoins();
            return trackedCoins.length ? 
                `Currently tracking: ${trackedCoins.join(', ')}` : 
                'Not tracking any cryptocurrencies';

        default:
            return "Usage: !track [start|stop|list] [symbols...]";
    }
}; 