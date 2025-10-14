import * as ccxt from 'ccxt';
import { IFetcher } from '../../interfaces/IFetcher';

export class BtccFetcher implements IFetcher {
  private readonly exchange: ccxt.Exchange;

  constructor(apiKey: string, apiSecret: string) {
    // To satisfy TypeScript's strict type system when dealing with the dynamic
    // nature of the ccxt library, we cast it to 'any' before accessing the
    // exchange class by its string ID. The correct ID for BTCC is 'btcturk'.
    const exchangeId = 'btcturk';
    const exchangeClass = (ccxt as any)[exchangeId];
    if (!exchangeClass) {
      throw new Error(`Exchange with ID '${exchangeId}' not found in CCXT library.`);
    }
    this.exchange = new exchangeClass({
      apiKey: apiKey,
      secret: apiSecret,
    });
  }

  /**
   * Fetches the latest ticker price for a given trading pair from BTCC.
   * @param pair - The trading pair to fetch the price for (e.g., 'BTC/USDT').
   * @returns A promise that resolves to the current price.
   */
  async fetchPrice(pair: string): Promise<number> {
    try {
      const ticker = await this.exchange.fetchTicker(pair);
      if (!ticker.last) {
        throw new Error(`Last price for ${pair} is not available from BTCC.`);
      }
      return ticker.last;
    } catch (error) {
      console.error(`[BtccFetcher] Error fetching price for ${pair}:`, error);
      throw error;
    }
  }

  /**
   * Fetches the order book for a given trading pair from BTCC.
   * @param pair - The trading pair to fetch the order book for.
   * @returns A promise that resolves to the order book data.
   */
  async fetchOrderBook(pair: string): Promise<any> {
    try {
      const orderBook = await this.exchange.fetchOrderBook(pair);
      return orderBook;
    } catch (error) {
      console.error(`[BtccFetcher] Error fetching order book for ${pair}:`, error);
      throw error;
    }
  }
}