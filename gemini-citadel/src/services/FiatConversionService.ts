import axios from 'axios';
import { fiatConfig } from '../config/fiat.config';
import logger from './logger.service';

interface ExchangeRates {
  [currency: string]: {
    '15m': number;
    last: number;
    buy: number;
    sell: number;
    symbol: string;
  };
}

interface CacheEntry {
  rates: ExchangeRates;
  timestamp: number;
}

export class FiatConversionService {
  private readonly apiUrl = 'https://blockchain.info/ticker';
  private readonly cacheDuration = 15 * 60 * 1000; // 15 minutes
  private cache: CacheEntry | null = null;

  public async getFiatConversion(
    amount: number,
    fromCurrency: string = 'USD' // Assuming profit is in a USD-pegged stablecoin
  ): Promise<string> {
    try {
      const rates = await this.getExchangeRates();
      if (!rates) {
        return ' (Fiat conversion unavailable)';
      }

      // The API returns rates relative to BTC. We need to convert from the input currency (e.g., USDT, assumed to be ~USD) to the target currencies.
      const fromRate = rates[fromCurrency];
      if (!fromRate) {
        logger.warn(
          `[FiatConversionService] Could not find exchange rate for source currency: ${fromCurrency}`
        );
        return ' (Fiat conversion unavailable)';
      }

      const conversions = fiatConfig.targetCurrencies
        .map((targetCurrency) => {
          const targetRate = rates[targetCurrency];
          if (targetRate) {
            const convertedValue = (amount * targetRate.last) / fromRate.last;
            return `${convertedValue.toFixed(2)} ${targetCurrency}`;
          }
          return null;
        })
        .filter((c) => c !== null)
        .join(', ');

      return conversions ? ` (~${conversions})` : '';
    } catch (error) {
      logger.error('[FiatConversionService] Error getting fiat conversion:', error);
      return ' (Fiat conversion unavailable)';
    }
  }

  private async getExchangeRates(): Promise<ExchangeRates | null> {
    const now = Date.now();
    if (this.cache && now - this.cache.timestamp < this.cacheDuration) {
      logger.info('[FiatConversionService] Returning cached exchange rates.');
      return this.cache.rates;
    }

    try {
      logger.info('[FiatConversionService] Fetching fresh exchange rates from API.');
      const response = await axios.get<ExchangeRates>(this.apiUrl);
      this.cache = {
        rates: response.data,
        timestamp: now,
      };
      return response.data;
    } catch (error) {
      logger.error('[FiatConversionService] Failed to fetch exchange rates from blockchain.com:', error);
      return null;
    }
  }
}
