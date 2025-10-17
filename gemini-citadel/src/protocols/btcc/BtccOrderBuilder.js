"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BtccOrderBuilder = void 0;
class BtccOrderBuilder {
    /**
     * Constructs a detailed log message for a trade opportunity.
     * This serves as the "Log-Only" implementation for the BTCC protocol.
     * @param opportunity - The trade opportunity to process.
     * @returns A promise that resolves to a formatted string for logging.
     */
    async buildOrder(opportunity) {
        const { estimatedProfit } = opportunity;
        const formatAction = (action) => {
            return `${action.action} ${action.amount} ${action.pair.split('/')[0]} on ${action.exchange} @ ${action.price}`;
        };
        const actionsString = opportunity.actions.map(formatAction).join(', ');
        const logMessage = `[OPPORTUNITY DETECTED] Actions: ${actionsString}. Estimated Profit (less fees): $${estimatedProfit.toFixed(2)}.`;
        // In a real implementation, this would involve creating and sending an API request.
        // For now, we just return the string to be logged.
        return Promise.resolve(logMessage);
    }
}
exports.BtccOrderBuilder = BtccOrderBuilder;
