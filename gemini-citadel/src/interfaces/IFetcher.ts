/**
 * @interface IFetcher
 * @description Defines the standard for all exchange-specific data fetchers.
 * Any class that retrieves market data from an exchange (CEX or DEX)
 * must implement this interface.
 */
export interface IFetcher {
  /**
   * Fetches the latest price for a given trading pair.
   * @param pair - The trading pair to fetch the price for (e.g., 'BTC/USDT').
   * @returns A promise that resolves to the current price.
   */
  fetchPrice(pair: string): Promise<number>;

  /**
   * Fetches the order book for a given trading pair.
   * @param pair - The trading pair to fetch the order book for.
   * @returns A promise that resolves to the order book data.
   */
  fetchOrderBook(pair: string): Promise<any>; // Replace 'any' with a proper OrderBook type later
}