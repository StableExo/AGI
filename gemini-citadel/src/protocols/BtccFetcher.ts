import axios from 'axios';
import { ICexFetcher, IOrderBook, ITicker } from '../interfaces/ICexFetcher';
import { ITradePair } from '../interfaces/ITradePair';
import { botConfig } from '../config/bot.config';
import logger from '../services/logger.service';

// Basic implementation, will be expanded upon.
export class BtccFetcher implements ICexFetcher {
  public readonly exchangeId = 'btcc';

  public async getTicker(pair: ITradePair): Promise<ITicker> {
    const market = `${pair.base}${pair.quote}`;
    // Note: This uses the BTCC Spot API endpoint.
    const url = `${botConfig.btcc.apiUrl}/market/last?market=${market}`;
    try {
      const response = await axios.get(url);
      const price = parseFloat(response.data.result);
      if (isNaN(price)) {
        throw new Error(`Invalid price data from BTCC for ${market}`);
      }
      // BTCC API does not provide volume in the 'last' endpoint, setting to 0.
      // A more advanced implementation would hit the 'ticker' endpoint.
      return { price, volume: 0 };
    } catch (error) {
      logger.error(`[BtccFetcher] Error fetching ticker for ${market}:`, error);
      throw error;
    }
  }

  public async getOrderBook(pair: ITradePair): Promise<IOrderBook> {
    // Placeholder for order book logic.
    // A real implementation would fetch from BTCC's order book endpoint.
    logger.warn(`[BtccFetcher] getOrderBook is not yet implemented.`);
    return { bids: [], asks: [] };
  }
}