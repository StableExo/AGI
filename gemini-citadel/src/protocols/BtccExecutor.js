"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BtccExecutor = void 0;
const logger_service_1 = __importDefault(require("../services/logger.service"));
// Basic implementation, will be expanded upon.
class BtccExecutor {
    constructor() {
        this.exchangeId = 'btcc';
        this.executionMode = process.env.EXECUTION_MODE;
    }
    async placeOrder(order) {
        if (this.executionMode === 'DRY_RUN') {
            logger_service_1.default.info(`[BtccExecutor-DRY_RUN] Intended to place ${order.side} ${order.type} order for ${order.amount} ${order.pair.base} at price ${order.price}`);
            return { ...order, id: 'dry-run-order-id', status: 'OPEN' };
        }
        // Placeholder for live order placement logic.
        // A real implementation would make an authenticated API call to BTCC.
        logger_service_1.default.warn(`[BtccExecutor] Live order placement is not yet implemented.`);
        // In a real scenario, we would get a real order ID from the exchange.
        const newOrder = { ...order, id: `live-order-${Date.now()}`, status: 'OPEN' };
        return newOrder;
    }
    async getOrderStatus(orderId) {
        // Placeholder for order status logic.
        logger_service_1.default.warn(`[BtccExecutor] getOrderStatus is not yet implemented.`);
        throw new Error('getOrderStatus not implemented');
    }
    async getBalances() {
        // Placeholder for balance fetching logic.
        logger_service_1.default.warn(`[BtccExecutor] getBalances is not yet implemented.`);
        return {};
    }
}
exports.BtccExecutor = BtccExecutor;
