"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockExecutor = void 0;
class MockExecutor {
    async placeOrder(action) {
        console.log(`[MockExecutor] Received request to ${action.action} ${action.amount} of ${action.pair} at price ${action.price}`);
        // Simulate a successful order execution
        const receipt = {
            success: true,
            orderId: `mock-${Date.now()}`,
            filledAmount: action.amount,
        };
        return Promise.resolve(receipt);
    }
}
exports.MockExecutor = MockExecutor;
