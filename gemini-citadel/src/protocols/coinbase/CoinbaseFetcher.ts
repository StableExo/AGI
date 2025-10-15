import { IFetcher } from '../../interfaces/IFetcher';
import axios from 'axios';

const API_BASE_URL = 'https://api.coinbase.com/v2';

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
            console.error(`[CoinbaseFetcher] API Request FAILED for GET ${path}:`, error.response ? error.response.data : error.message);
            throw error;
        }
    }

    async fetchPrice(pair: string): Promise<number> {
        // Coinbase API uses '-' as a separator, e.g., 'BTC-USD'
        if (!pair.includes('-')) {
            throw new Error(`Invalid pair format for Coinbase: ${pair}. Expected format like 'BTC-USD'.`);
        }
        try {
            console.log(`[CoinbaseFetcher] Fetching price for ${pair}...`);
            const data = await this.makePublicRequest(`/prices/${pair}/spot`);

            if (data && data.data && typeof data.data.amount === 'string') {
                const price = parseFloat(data.data.amount);
                console.log(`[CoinbaseFetcher] Successfully fetched price for ${pair}: ${price}`);
                return price;
            } else {
                console.error(`[CoinbaseFetcher] Unexpected response structure for ${pair}:`, data);
                throw new Error(`Unexpected response structure for ${pair}.`);
            }
        } catch (error) {
            console.error(`[CoinbaseFetcher] Failed to fetch price for ${pair}.`);
            throw error;
        }
    }

    async fetchOrderBook(pair: string): Promise<any> {
        // This method is not required for the current task.
        return {};
    }
}