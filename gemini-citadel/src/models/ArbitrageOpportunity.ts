import { ITradeAction } from '../interfaces/ITradeAction';

/**
 * Represents a single arbitrage opportunity.
 * This class encapsulates all the information needed to evaluate and execute a trade.
 */
export class ArbitrageOpportunity {
  public readonly type: 'Arbitrage' = 'Arbitrage';
  public readonly estimatedProfit: number;
  public readonly actions: [ITradeAction, ITradeAction];
  public readonly timestamp: number;

  /**
   * Creates an instance of ArbitrageOpportunity.
   * @param estimatedProfit The calculated profit for this opportunity, after fees.
   * @param buyAction The 'Buy' action to be executed.
   * @param sellAction The 'Sell' action to be executed.
   */
  constructor(estimatedProfit: number, buyAction: ITradeAction, sellAction: ITradeAction) {
    if (buyAction.action !== 'Buy' || sellAction.action !== 'Sell') {
      throw new Error("Actions must be 'Buy' and 'Sell' in the correct order.");
    }

    this.estimatedProfit = estimatedProfit;
    this.actions = [buyAction, sellAction];
    this.timestamp = Date.now();
  }

  /**
   * Provides a brief summary of the opportunity.
   * @returns A string summarizing the trade.
   */
  public getSummary(): string {
    const buyAction = this.actions[0];
    const sellAction = this.actions[1];
    return `Arbitrage Opportunity:
    - Buy ${buyAction.amount} ${buyAction.pair} on ${buyAction.exchange} @ ${buyAction.price}
    - Sell ${sellAction.amount} ${sellAction.pair} on ${sellAction.exchange} @ ${sellAction.price}
    - Estimated Profit: ${this.estimatedProfit.toFixed(4)}`;
  }
}