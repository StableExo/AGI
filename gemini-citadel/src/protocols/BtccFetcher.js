"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BtccFetcher = void 0;
const axios_1 = __importDefault(require("axios"));
const bot_config_1 = require("../config/bot.config");
const logger_service_1 = __importDefault(require("../services/logger.service"));
// Basic implementation, will be expanded upon.
class BtccFetcher {
    constructor() {
        this.exchangeId = 'btcc';
    }
    async getTicker(pair) {
        const market = `${pair.base}${pair.quote}`;
        // Note: This uses the BTCC Spot API endpoint.
        const url = `${bot_config_1.botConfig.btcc.apiUrl}/market/last?market=${market}`;
        try {
            const response = await axios_1.default.get(url);
            const price = parseFloat(response.data.result);
            if (isNaN(price)) {
                throw new Error(`Invalid price data from BTCC for ${market}`);
            }
            // BTCC API does not provide volume in the 'last' endpoint, setting to 0.
            // A more advanced implementation would hit the 'ticker' endpoint.
            return { price, volume: 0 };
        }
        catch (error) {
            logger_service_1.default.error(`[BtccFetcher] Error fetching ticker for ${market}:`, error);
            throw error;
        }
    }
    async getOrderBook(pair) {
        // Placeholder for order book logic.
        // A real implementation would fetch from BTCC's order book endpoint.
        logger_service_1.default.warn(`[BtccFetcher] getOrderBook is not yet implemented.`);
        return { bids: [], asks: [] };
    }
}
exports.BtccFetcher = BtccFetcher;
