"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionManager = void 0;
const logger_service_1 = __importDefault(require("./logger.service"));
class ExecutionManager {
    constructor(flashbotsService, executionSigner, exchangeDataProvider) {
        this.flashbotsService = flashbotsService;
        this.executionSigner = executionSigner;
        this.exchangeDataProvider = exchangeDataProvider;
        logger_service_1.default.info(`[ExecutionManager] Initialized.`);
    }
    async executeCexTrade(opportunity) {
        logger_service_1.default.info(`[ExecutionManager] Executing CEX opportunity with profit: ${opportunity.profit}`);
        const results = await Promise.all(opportunity.tradeActions.map(async (action) => {
            const executor = this.exchangeDataProvider.getExecutor(action.exchange);
            if (!executor) {
                const message = `Could not find executor for exchange: ${action.exchange}`;
                logger_service_1.default.error(message);
                return { success: false, message };
            }
            try {
                const receipt = await executor.placeOrder(action);
                if (receipt.success) {
                    logger_service_1.default.info(`Placed order on ${action.exchange}: ${receipt.orderId}`);
                }
                else {
                    logger_service_1.default.error(`Failed to place order on ${action.exchange}: ${receipt.message}`);
                }
                return receipt;
            }
            catch (error) {
                const message = `Exception executing order on ${action.exchange}: ${error.message}`;
                logger_service_1.default.error(message, error);
                return { success: false, message };
            }
        }));
        if (results.every(r => r.success)) {
            logger_service_1.default.info(`[ExecutionManager] Successfully executed CEX opportunity. Order IDs: ${results
                .map(r => r.orderId)
                .join(', ')}`);
        }
        else {
            logger_service_1.default.error('[ExecutionManager] One or more orders failed to execute.');
        }
    }
    /**
     * Executes an arbitrage opportunity by encoding it for the FlashSwap contract
     * and submitting it as a bundle to Flashbots.
     * @param opportunity - The arbitrage opportunity, enriched with on-chain data.
     * @param flashSwapContractAddress - The address of the deployed FlashSwap contract.
     * @returns A promise that resolves with a boolean indicating if the bundle was included.
     */
    async executeTrade(opportunity, flashSwapContractAddress) {
        throw new Error('On-chain DEX execution is not implemented in this version.');
    }
}
exports.ExecutionManager = ExecutionManager;
