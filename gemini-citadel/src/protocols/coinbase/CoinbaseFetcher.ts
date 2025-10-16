import { IFetcher } from '../../interfaces/IFetcher';
import axios from 'axios';
import logger from '../../services/logger.service';

const API_BASE_URL = 'https://api.coinbase.com/api/v3/brokerage';

export class CoinbaseFetcher implements IFetcher {
    constructor() {
        // No-op
    }

    private async makePublicRequest(path: string, params: Record<string, any> = {}) {
        const url = `${API_BASE_URL}${path}`;
        try {
            const response = await axios.get(url, { params });
            return response.data;
        } catch (error: any) {
            logger.error(`[CoinbaseFetcher] API Request FAILED for GET ${path}:`, error.response ? error.response.data : error.message);
            throw error;
        }
    }

    async fetchPrice(pair: string): Promise<number> {
        // Coinbase API uses '-' as a separator, e.g., 'BTC-USD'
        if (!pair.includes('-')) {
            throw new Error(`Invalid pair format for Coinbase: ${pair}. Expected format like 'BTC-USD'.`);
        }
        try {
            logger.info(`[CoinbaseFetcher] Fetching price for ${pair}...`);
            // The Advanced Trade API uses product_id for pairs
            const data = await this.makePublicRequest(`/products/${pair}`);

            if (data && typeof data.price === 'string') {
                const price = parseFloat(data.price);
                logger.info(`[CoinbaseFetcher] Successfully fetched price for ${pair}: ${price}`);
                return price;
            } else {
                logger.error(`[CoinbaseFetcher] Unexpected response structure for ${pair}:`, data);
                throw new Error(`Unexpected response structure for ${pair}.`);
            }
        } catch (error) {
            logger.error(`[CoinbaseFetcher] Failed to fetch price for ${pair}.`);
            throw error;
        }
    }

    async fetchOrderBook(pair: string): Promise<any> {
        // This method is not required for the current task.
        return {};
    }
}