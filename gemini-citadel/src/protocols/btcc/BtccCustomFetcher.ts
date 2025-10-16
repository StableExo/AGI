// FILE: gemini-citadel/src/protocols/btcc/BtccCustomFetcher.ts

import { IFetcher } from '../../interfaces/IFetcher';
import axios from 'axios';
import logger from '../../services/logger.service';

const API_BASE_URL = 'https://spotapi2.btcccdn.com';

export class BtccCustomFetcher implements IFetcher {
    constructor() {
        // No-op
    }

    // A private helper for making public, unsigned requests
    private async makePublicRequest(path: string, params: Record<string, any> = {}) {
        const url = `${API_BASE_URL}${path}`;
        try {
            const response = await axios.get(url, { params });
            return response.data;
        } catch (error: any) {
            logger.error(`[BtccCustomFetcher] API Request FAILED for GET ${path}:`, error.response ? error.response.data : error.message);
            throw error;
        }
    }

    // --- Placeholder implementations for IFetcher interface ---
    async fetchPrice(pair: string): Promise<number> {
        if (!pair.includes('/')) {
            throw new Error(`Invalid pair format: ${pair}`);
        }
        try {
            logger.info(`[BtccCustomFetcher] Fetching price for ${pair}...`);
            const market = pair.replace('/', '');
            const data = await this.makePublicRequest('/btcc_api_trade/market/last', { market });

            if (data && typeof data.result === 'string') {
                const price = parseFloat(data.result);
                logger.info(`[BtccCustomFetcher] Successfully fetched price for ${pair}: ${price}`);
                return price;
            } else {
                logger.error(`[BtccCustomFetcher] Unexpected response structure for ${pair}:`, data);
                throw new Error(`Unexpected response structure for ${pair}.`);
            }
        } catch (error) {
            logger.error(`[BtccCustomFetcher] Failed to fetch price for ${pair}.`);
            throw error;
        }
    }

    async fetchOrderBook(pair: string): Promise<any> {
        // This method is not required for the current task.
        return {};
    }
}