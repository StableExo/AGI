import axios from 'axios';
import logger from './logger.service';

export interface IGlobalMarketMetrics {
  totalMarketCap: number;
  btcDominance: number;
  volume24h: number;
}

class MarketIntelligenceService {
  private apiKey: string;
  private readonly baseUrl = 'https://pro-api.coinmarketcap.com';

  constructor() {
    this.apiKey = process.env.COINMARKETCAP_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('COINMARKETCAP_API_KEY not found in environment variables. MarketIntelligenceService will be disabled.');
    }
  }

  async getGlobalMarketMetrics(): Promise<IGlobalMarketMetrics | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/v1/global-metrics/quotes/latest`, {
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKey,
        },
      });

      const data = response.data.data.quote.USD;

      return {
        totalMarketCap: data.total_market_cap,
        btcDominance: data.btc_dominance,
        volume24h: data.total_volume_24h,
      };
    } catch (error) {
      logger.error('Error fetching global market metrics from CoinMarketCap:', error);
      return null;
    }
  }
}

export { MarketIntelligenceService };
