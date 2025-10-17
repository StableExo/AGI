"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockMarketAnalyticsService = void 0;
class MockMarketAnalyticsService {
    getHistoricalData(exchange, pair, startTime, endTime, timeframe) {
        const data = [];
        let currentTime = startTime.getTime();
        while (currentTime <= endTime.getTime()) {
            data.push({
                open_time: currentTime,
                open: 100,
                high: 110,
                low: 90,
                close: 105,
                volume: 1000,
                close_time: currentTime + 3600000 - 1,
            });
            currentTime += 3600000;
        }
        return Promise.resolve(data);
    }
}
exports.MockMarketAnalyticsService = MockMarketAnalyticsService;
