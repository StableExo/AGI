"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArbitrageOpportunity = void 0;
class ArbitrageOpportunity {
    constructor(profit, tradeActions) {
        this.profitable = profit > 0;
        this.profit = profit;
        this.tradeActions = tradeActions;
    }
}
exports.ArbitrageOpportunity = ArbitrageOpportunity;
