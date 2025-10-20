import axios from 'axios';
import { FIAT_CURRENCIES } from '../config/fiat.config';
import logger from './logger.service';

const API_URL = 'https://api.blockchain.com/v3/exchange/tickers';
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface PriceEvent {
  symbol: string;
  price_24h: number;
  volume_24h: number;
  last_trade_price: number;
}

interface RateCache {
  [key: string]: {
    rate: number;
    timestamp: number;
  };
}

class FiatConversionService {
  private cache: RateCache = {};
  private isInitialized = false;

  public async getConversionRate(currency: string): Promise<number | null> {
    const cached = this.cache[currency];
    const isCacheValid = cached && Date.now() - cached.timestamp < CACHE_DURATION_MS;

    if (!this.isInitialized || !isCacheValid) {
      await this.updateRates();
    }

    const updated = this.cache[currency];
    return updated ? updated.rate : null;
  }

  private async updateRates(): Promise<void> {
    try {
      const response = await axios.get<PriceEvent[]>(API_URL);
      const tickers = response.data;

      const newCache: RateCache = {};
      for (const currency of FIAT_CURRENCIES) {
        const pair = `BTC-${currency}`;
        const ticker = tickers.find(t => t.symbol === pair);
        if (ticker) {
          newCache[currency] = {
            rate: ticker.last_trade_price,
            timestamp: Date.now(),
          };
        }
      }
      this.cache = newCache;
      this.isInitialized = true;
      logger.info('Successfully updated fiat conversion rates.');
    } catch (error) {
      logger.error('Failed to update fiat conversion rates:', error);
    }
  }
}

export const fiatConversionService = new FiatConversionService();
