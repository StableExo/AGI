"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinbaseFetcher = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_service_1 = __importDefault(require("../../services/logger.service"));
const API_BASE_URL = 'https://api.coinbase.com/api/v3/brokerage';
class CoinbaseFetcher {
    constructor() {
        // No-op
    }
    async makePublicRequest(path, params = {}) {
        const url = `${API_BASE_URL}${path}`;
        try {
            const response = await axios_1.default.get(url, { params });
            return response.data;
        }
        catch (error) {
            logger_service_1.default.error(`[CoinbaseFetcher] API Request FAILED for GET ${path}:`, error.response ? error.response.data : error.message);
            throw error;
        }
    }
    async fetchPrice(pair) {
        // Coinbase API uses '-' as a separator, e.g., 'BTC-USD'
        if (!pair.includes('-')) {
            throw new Error(`Invalid pair format for Coinbase: ${pair}. Expected format like 'BTC-USD'.`);
        }
        try {
            logger_service_1.default.info(`[CoinbaseFetcher] Fetching price for ${pair}...`);
            // The Advanced Trade API uses product_id for pairs
            const data = await this.makePublicRequest(`/products/${pair}`);
            if (data && typeof data.price === 'string') {
                const price = parseFloat(data.price);
                logger_service_1.default.info(`[CoinbaseFetcher] Successfully fetched price for ${pair}: ${price}`);
                return price;
            }
            else {
                logger_service_1.default.error(`[CoinbaseFetcher] Unexpected response structure for ${pair}:`, data);
                throw new Error(`Unexpected response structure for ${pair}.`);
            }
        }
        catch (error) {
            logger_service_1.default.error(`[CoinbaseFetcher] Failed to fetch price for ${pair}.`);
            throw error;
        }
    }
    async fetchOrderBook(pair) {
        // This method is not required for the current task.
        return {};
    }
}
exports.CoinbaseFetcher = CoinbaseFetcher;
