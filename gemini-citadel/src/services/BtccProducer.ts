import axios from 'axios';
import { MarketDataProducer } from './MarketDataProducer';
import { botConfig } from '../config/bot.config';
import logger from './logger.service';
import { MarketDataEvent } from '../models/MarketDataEvent';

interface BtccTicker {
  // Assuming a structure for the BTCC ticker response.
  // This may need to be adjusted based on the actual API response.
  Ticker: {
    bid: string;
    ask: string;
    vol: string;
    last: string;
    high: string;
    low: string;
  };
  Timestamp: number;
}

export class BtccProducer extends MarketDataProducer {
  private sequenceId: number = 0;

  constructor() {
    super('btcc');
  }

  protected async fetchData(): Promise<void> {
    // For this PoC, we will fetch a hardcoded symbol.
    const symbol = 'BTC-USDT';
    const normalizedSymbol = 'BTC/USDT';

    // A more complete implementation would fetch from an endpoint that provides full ticker data.
    // Based on the existing fetcher, we assume a base URL from config and append a ticker path.
    const url = `${botConfig.btcc.apiUrl}/market/ticker?market=${symbol}`;

    try {
      const response = await axios.get<BtccTicker>(url);
      const ticker = response.data.Ticker;
      const exchange_timestamp = response.data.Timestamp * 1000; // Assuming seconds, convert to ms

      const processing_timestamp = Date.now();
      const bidPrice = parseFloat(ticker.bid);
      const askPrice = parseFloat(ticker.ask);
      const spread = askPrice - bidPrice;

      const eventData: Omit<MarketDataEvent, 'event_id' | 'schema_version'> = {
        exchange: this.exchange,
        symbol: normalizedSymbol,
        bid: {
          price: bidPrice,
          quantity: 0, // Placeholder, as not provided by this specific endpoint
          liquidity: 0, // Placeholder
        },
        ask: {
          price: askPrice,
          quantity: 0, // Placeholder
          liquidity: 0, // Placeholder
        },
        spread: spread,
        spread_bps: (spread / askPrice) * 10000,
        volume_24h: parseFloat(ticker.vol),
        exchange_timestamp,
        processing_timestamp,
        latency_ms: processing_timestamp - exchange_timestamp,
        sequence_id: this.sequenceId++,
        is_snapshot: true, // Assuming the ticker provides a snapshot
      };

      await this.publish(eventData);

    } catch (error) {
      logger.error(`[BtccProducer] Error fetching data for ${symbol}:`, error);
    }
  }
}
