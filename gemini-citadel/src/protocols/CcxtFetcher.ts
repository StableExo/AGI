import * as ccxt from 'ccxt';
import { ICexFetcher, ITicker } from '../interfaces/ICexFetcher';
import { ITradePair } from '../interfaces/ITradePair';
import logger from '../services/logger.service';

export class CcxtFetcher implements ICexFetcher {
  public readonly exchangeId: string;
  private readonly exchange: ccxt.Exchange;

  constructor(exchangeId: string, apiKey?: string, apiSecret?: string) {
    // Cast ccxt.pro to any to allow dynamic exchange loading by string key.
    const exchangeMap = ccxt.pro as any;
    if (!exchangeMap[exchangeId]) {
      throw new Error(`Exchange '${exchangeId}' is not supported by CCXT.`);
    }
    this.exchangeId = exchangeId;
    // Let TypeScript infer the options type.
    const exchangeOptions = {
      apiKey,
      secret: apiSecret,
    };
    this.exchange = new exchangeMap[exchangeId](exchangeOptions);
  }

  public async getTicker(pair: ITradePair): Promise<ITicker> {
    const symbol = `${pair.base}/${pair.quote}`;
    try {
      const ticker = await this.exchange.fetchTicker(symbol);
      if (!ticker || !ticker.last) {
        throw new Error(`Ticker for ${symbol} on ${this.exchangeId} is undefined or has no last price.`);
      }
      return {
        price: ticker.last,
        volume: ticker.baseVolume || 0,
      };
    } catch (error) {
      logger.error(`[CcxtFetcher] Error fetching ticker for ${symbol} on ${this.exchangeId}:`, error);
      throw error;
    }
  }

  public async getOrderBook(pair: ITradePair): Promise<any> {
    // This method is not required for the initial implementation.
    // We will implement it in a future development cycle.
    throw new Error('Method not implemented.');
  }
}