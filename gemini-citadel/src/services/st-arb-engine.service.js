"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StArbEngine = void 0;
const ArbitrageOpportunity_1 = require("../models/ArbitrageOpportunity");
class StArbEngine {
    constructor(marketAnalyticsService, exchangeDataProvider) {
        this.marketAnalyticsService = marketAnalyticsService;
        this.exchangeDataProvider = exchangeDataProvider;
        // These would be loaded from a config file
        this.pairs = [{ pair1: 'BTC/USDT', pair2: 'ETH/USDT', exchange: 'kraken' }];
        this.lookbackDays = 30;
        this.zScoreThreshold = 2.0;
    }
    async run() {
        const opportunities = [];
        for (const pairInfo of this.pairs) {
            const { pair1, pair2, exchange } = pairInfo;
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - this.lookbackDays);
            const [history1, history2] = await Promise.all([
                this.marketAnalyticsService.getHistoricalData(exchange, pair1, startDate, endDate, '1h'),
                this.marketAnalyticsService.getHistoricalData(exchange, pair2, startDate, endDate, '1h')
            ]);
            if (history1.length === 0 || history2.length === 0) {
                console.warn(`No historical data for ${pair1} or ${pair2}`);
                continue;
            }
            const spreadHistory = this.calculateSpreadHistory(history1, history2);
            const { mean, stdDev } = this.calculateMeanAndStdDev(spreadHistory);
            const [price1, price2] = await Promise.all([
                this.exchangeDataProvider.getTicker(exchange, pair1),
                this.exchangeDataProvider.getTicker(exchange, pair2)
            ]);
            const currentSpread = price1.last - price2.last;
            const zScore = (currentSpread - mean) / stdDev;
            if (zScore > this.zScoreThreshold) {
                // Spread is unusually high, sell pair1 and buy pair2
                const opportunity = new ArbitrageOpportunity_1.ArbitrageOpportunity(currentSpread - mean, // Simplified profit calculation
                [
                    { exchange, pair: pair1, action: 'SELL', price: price1.last, amount: 1 },
                    { exchange, pair: pair2, action: 'BUY', price: price2.last, amount: (price1.last / price2.last) },
                ]);
                opportunities.push(opportunity);
            }
            else if (zScore < -this.zScoreThreshold) {
                // Spread is unusually low, buy pair1 and sell pair2
                const opportunity = new ArbitrageOpportunity_1.ArbitrageOpportunity(mean - currentSpread, // Simplified profit calculation
                [
                    { exchange, pair: pair1, action: 'BUY', price: price1.last, amount: 1 },
                    { exchange, pair: pair2, action: 'SELL', price: price2.last, amount: (price1.last / price2.last) },
                ]);
                opportunities.push(opportunity);
            }
        }
        return opportunities;
    }
    calculateSpreadHistory(history1, history2) {
        const spreadHistory = [];
        const history2Map = new Map(history2.map(h => [h.open_time, h.close]));
        for (const h1 of history1) {
            if (history2Map.has(h1.open_time)) {
                spreadHistory.push(h1.close - history2Map.get(h1.open_time));
            }
        }
        return spreadHistory;
    }
    calculateMeanAndStdDev(data) {
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const stdDev = Math.sqrt(data.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / data.length);
        return { mean, stdDev };
    }
}
exports.StArbEngine = StArbEngine;
