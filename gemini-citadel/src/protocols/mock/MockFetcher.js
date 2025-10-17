"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockFetcher = void 0;
class MockFetcher {
    constructor(multiplier = 1.001) {
        this.basePrice = 0;
        this.multiplier = multiplier;
    }
    /**
     * Sets the multiplier for the mock price calculation.
     * @param multiplier The new multiplier value.
     */
    setPriceMultiplier(multiplier) {
        this.multiplier = multiplier;
    }
    /**
     * Sets the base price that the mock fetcher will use for its calculations.
     * In a real scenario, this would be set by the StrategyEngine after fetching
     * the price from the primary exchange.
     * @param price The price from the primary exchange.
     */
    setBasePrice(price) {
        this.basePrice = price;
    }
    /**
     * Fetches a mock price by applying the multiplier to the base price.
     * @param _pair The trading pair (ignored by the mock).
     * @returns A promise that resolves to the calculated mock price.
     */
    async fetchPrice(_pair) {
        if (this.basePrice === 0) {
            throw new Error("MockFetcher base price has not been set. Call setBasePrice() before fetching.");
        }
        const mockPrice = this.basePrice * this.multiplier;
        console.log(`[MockFetcher] Calculating mock price: ${this.basePrice} * ${this.multiplier} = ${mockPrice}`);
        return Promise.resolve(mockPrice);
    }
    /**
     * Mock implementation for fetching an order book. Returns an empty object.
     * @param _pair The trading pair (ignored by the mock).
     * @returns A promise that resolves to an empty object.
     */
    async fetchOrderBook(_pair) {
        return Promise.resolve({});
    }
    /**
     * Mock implementation for testing the connection. Returns a success message.
     * @returns A promise that resolves to a success object.
     */
    async testConnection() {
        console.log('[MockFetcher] Connection test successful.');
        return Promise.resolve({ success: true, message: "Mock connection is active." });
    }
}
exports.MockFetcher = MockFetcher;
