"use strict";
// FILE: gemini-citadel/src/protocols/btcc/BtccCustomFetcher.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BtccCustomFetcher = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_service_1 = __importDefault(require("../../services/logger.service"));
const API_BASE_URL = 'https://spotapi2.btcccdn.com';
class BtccCustomFetcher {
    constructor() {
        // No-op
    }
    // A private helper for making public, unsigned requests
    async makePublicRequest(path, params = {}) {
        const url = `${API_BASE_URL}${path}`;
        try {
            const response = await axios_1.default.get(url, { params });
            return response.data;
        }
        catch (error) {
            logger_service_1.default.error(`[BtccCustomFetcher] API Request FAILED for GET ${path}:`, error.response ? error.response.data : error.message);
            throw error;
        }
    }
    // --- Placeholder implementations for IFetcher interface ---
    async fetchPrice(pair) {
        if (!pair.includes('/')) {
            throw new Error(`Invalid pair format: ${pair}`);
        }
        try {
            logger_service_1.default.info(`[BtccCustomFetcher] Fetching price for ${pair}...`);
            const market = pair.replace('/', '');
            const data = await this.makePublicRequest('/btcc_api_trade/market/last', { market });
            if (data && typeof data.result === 'string') {
                const price = parseFloat(data.result);
                logger_service_1.default.info(`[BtccCustomFetcher] Successfully fetched price for ${pair}: ${price}`);
                return price;
            }
            else {
                logger_service_1.default.error(`[BtccCustomFetcher] Unexpected response structure for ${pair}:`, data);
                throw new Error(`Unexpected response structure for ${pair}.`);
            }
        }
        catch (error) {
            logger_service_1.default.error(`[BtccCustomFetcher] Failed to fetch price for ${pair}.`);
            throw error;
        }
    }
    async fetchOrderBook(pair) {
        // This method is not required for the current task.
        return {};
    }
}
exports.BtccCustomFetcher = BtccCustomFetcher;
