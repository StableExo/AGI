"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockExchangeDataProvider = void 0;
class MockExchangeDataProvider {
    getTicker(exchange, pair) {
        return Promise.resolve({
            symbol: pair,
            last: 100,
            timestamp: Date.now(),
            datetime: new Date().toISOString(),
            high: 110,
            low: 90,
            bid: 99.9,
            bidVolume: 10,
            ask: 100.1,
            askVolume: 10,
            vwap: 105,
            open: 100,
            close: 105,
            previousClose: 100,
            change: 5,
            percentage: 5,
            average: 102.5,
            baseVolume: 1000,
            quoteVolume: 105000,
            info: {},
        });
    }
}
exports.MockExchangeDataProvider = MockExchangeDataProvider;
