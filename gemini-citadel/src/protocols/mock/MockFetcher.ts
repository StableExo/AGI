import { IFetcher } from '../../interfaces/IFetcher';

export class MockFetcher implements IFetcher {
    private prices: Map<string, number> = new Map();
    private basePrice: number = 0;
    private multiplier: number;

    constructor(multiplier: number = 1.001) { // Default to a 0.1% higher price
        this.multiplier = multiplier;
    }

    /**
     * Directly sets the price for a given trading pair.
     * @param pair The trading pair (e.g., 'BTC-USD').
     * @param price The price to set.
     */
    public setPrice(pair: string, price: number): void {
        this.prices.set(pair, price);
    }

    /**
     * Sets the multiplier for the mock price calculation.
     * @param multiplier The new multiplier value.
     */
    public setPriceMultiplier(multiplier: number): void {
        this.multiplier = multiplier;
    }

    /**
     * Sets the base price that the mock fetcher will use for its calculations.
     * In a real scenario, this would be set by the StrategyEngine after fetching
     * the price from the primary exchange.
     * @param price The price from the primary exchange.
     */
    public setBasePrice(price: number): void {
        this.basePrice = price;
    }

    /**
     * Fetches a mock price. If a specific price has been set for the pair,
     * it returns that price. Otherwise, it calculates a price based on the
     * base price and multiplier.
     * @param pair The trading pair.
     * @returns A promise that resolves to the mock price.
     */
    async fetchPrice(pair: string): Promise<number> {
        if (this.prices.has(pair)) {
            const price = this.prices.get(pair)!;
            console.log(`[MockFetcher] Returning preset price for ${pair}: ${price}`);
            return Promise.resolve(price);
        }

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
    async fetchOrderBook(_pair: string): Promise<any> {
        return Promise.resolve({});
    }

    /**
     * Mock implementation for testing the connection. Returns a success message.
     * @returns A promise that resolves to a success object.
     */
    public async testConnection(): Promise<any> {
        console.log('[MockFetcher] Connection test successful.');
        return Promise.resolve({ success: true, message: "Mock connection is active." });
    }
}