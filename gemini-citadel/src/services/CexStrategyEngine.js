"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CexStrategyEngine = void 0;
const ArbitrageOpportunity_1 = require("../models/ArbitrageOpportunity");
const logger_service_1 = __importDefault(require("./logger.service"));
class CexStrategyEngine {
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    async findOpportunities(pairs) {
        const opportunities = [];
        const fetchers = this.dataProvider.getAllCexFetchers();
        const exchangeIds = Array.from(fetchers.keys());
        if (exchangeIds.length < 2) {
            logger_service_1.default.warn('[CexStrategyEngine] Need at least two CEX fetchers to find arbitrage opportunities.');
            return [];
        }
        // This loop structure compares every exchange with every other exchange.
        for (let i = 0; i < exchangeIds.length; i++) {
            for (let j = i + 1; j < exchangeIds.length; j++) {
                const exchangeAId = exchangeIds[i];
                const exchangeBId = exchangeIds[j];
                const fetcherA = fetchers.get(exchangeAId);
                const fetcherB = fetchers.get(exchangeBId);
                // In a real system, you'd check for common pairs. Here we iterate through a provided list.
                for (const pair of pairs) {
                    try {
                        const [tickerA, tickerB] = await Promise.all([
                            fetcherA.getTicker(pair),
                            fetcherB.getTicker(pair),
                        ]);
                        const feeA = this.dataProvider.getCexFee(exchangeAId);
                        const feeB = this.dataProvider.getCexFee(exchangeBId);
                        // Scenario 1: Buy on A, Sell on B
                        const profit1 = (tickerB.price * (1 - feeB)) - (tickerA.price * (1 + feeA));
                        if (profit1 > 0) {
                            const buyAction = {
                                action: 'BUY',
                                exchange: exchangeAId,
                                pair: `${pair.base}/${pair.quote}`,
                                price: tickerA.price,
                                amount: 1, // Assuming amount of 1 for now
                            };
                            const sellAction = {
                                action: 'SELL',
                                exchange: exchangeBId,
                                pair: `${pair.base}/${pair.quote}`,
                                price: tickerB.price,
                                amount: 1,
                            };
                            opportunities.push(new ArbitrageOpportunity_1.ArbitrageOpportunity(profit1, [buyAction, sellAction]));
                        }
                        // Scenario 2: Buy on B, Sell on A
                        const profit2 = (tickerA.price * (1 - feeA)) - (tickerB.price * (1 + feeB));
                        if (profit2 > 0) {
                            const buyAction = {
                                action: 'BUY',
                                exchange: exchangeBId,
                                pair: `${pair.base}/${pair.quote}`,
                                price: tickerB.price,
                                amount: 1,
                            };
                            const sellAction = {
                                action: 'SELL',
                                exchange: exchangeAId,
                                pair: `${pair.base}/${pair.quote}`,
                                price: tickerA.price,
                                amount: 1,
                            };
                            opportunities.push(new ArbitrageOpportunity_1.ArbitrageOpportunity(profit2, [buyAction, sellAction]));
                        }
                    }
                    catch (error) {
                        logger_service_1.default.error(`[CexStrategyEngine] Error comparing ${pair.base}/${pair.quote} between ${exchangeAId} and ${exchangeBId}:`, error);
                    }
                }
            }
        }
        return opportunities;
    }
}
exports.CexStrategyEngine = CexStrategyEngine;
