import { IFetcher } from '../../interfaces/IFetcher';

export class MockFetcher implements IFetcher {
    private basePrice: number = 0;
    private multiplier: number;

    constructor(multiplier: number = 1.001) { // Default to a 0.1% higher price
        this.multiplier = multiplier;
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
     * Fetches a mock price by applying the multiplier to the base price.
     * @param _pair The trading pair (ignored by the mock).
     * @returns A promise that resolves to the calculated mock price.
     */
    async fetchPrice(_pair: string): Promise<number> {
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