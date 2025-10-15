import { BigNumberish } from 'ethers';
import { ITradeAction } from '../interfaces/ITradeAction';

/**
 * Represents a single arbitrage opportunity, enriched for on-chain execution.
 * This class encapsulates all the information needed to evaluate and execute a trade
 * using the FlashSwap smart contract.
 */
export class ArbitrageOpportunity {
  public readonly type: 'Arbitrage' = 'Arbitrage';
  public readonly estimatedProfit: number;
  public readonly actions: ITradeAction[];
  public readonly timestamp: number;

  // On-chain execution specific fields
  public flashLoanPool: string = '';
  public flashLoanToken: string = '';
  public flashLoanAmount: BigNumberish = 0;

  /**
   * Creates an instance of ArbitrageOpportunity.
   * @param estimatedProfit The calculated profit for this opportunity, after fees.
   * @param actions An array of trade actions. For a simple arbitrage, this would be a buy and a sell.
   */
  constructor(estimatedProfit: number, actions: ITradeAction[]) {
    this.estimatedProfit = estimatedProfit;
    this.actions = actions;
    this.timestamp = Date.now();
  }

  /**
   * Enriches the opportunity with the necessary data for an on-chain flash loan.
   * This would typically be called by the StrategyEngine after identifying a viable opportunity.
   * @param poolAddress The address of the Uniswap V3 pool for the flash loan.
   * @param tokenAddress The address of the token to be borrowed.
   * @param amount The amount of the token to borrow.
   */
  public setFlashLoanDetails(poolAddress: string, tokenAddress: string, amount: BigNumberish): void {
    this.flashLoanPool = poolAddress;
    this.flashLoanToken = tokenAddress;
    this.flashLoanAmount = amount;
  }

  /**
   * Provides a brief summary of the opportunity.
   * @returns A string summarizing the trade.
   */
  public getSummary(): string {
    const actionSummaries = this.actions.map(a =>
      `  - ${a.action} ${a.amount} ${a.pair} on ${a.exchange} @ ${a.price}`
    ).join('\n');

    const flashLoanSummary = this.flashLoanPool
      ? `\n  - Flash Loan: ${this.flashLoanAmount.toString()} of ${this.flashLoanToken} from ${this.flashLoanPool}`
      : '';

    return `Arbitrage Opportunity:
${actionSummaries}
    - Estimated Profit: ${this.estimatedProfit.toFixed(4)}${flashLoanSummary}`;
  }
}