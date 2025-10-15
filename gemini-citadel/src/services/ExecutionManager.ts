import { ArbitrageOpportunity } from '../models/ArbitrageOpportunity';
import { ExchangeDataProvider } from './ExchangeDataProvider';
import { ITradeReceipt } from '../interfaces/ITradeReceipt';

export class ExecutionManager {
  private dataProvider: ExchangeDataProvider;

  constructor(dataProvider: ExchangeDataProvider) {
    this.dataProvider = dataProvider;
    console.log(`[ExecutionManager] Initialized.`);
  }

  /**
   * Executes a trade opportunity by sequentially placing orders for each action.
   * Implements a "Halt and Alert" policy: if any action fails, it throws a
   * critical error to prevent leaving the system in a partially executed state.
   * @param opportunity - The trade opportunity to execute.
   * @returns A promise that resolves with an array of trade receipts upon full success.
   */
  public async executeTrade(opportunity: ArbitrageOpportunity): Promise<ITradeReceipt[]> {
    const receipts: ITradeReceipt[] = [];

    console.log(`[ExecutionManager] Received trade to execute: ${opportunity.getSummary()}`);

    for (const action of opportunity.actions) {
      const executor = this.dataProvider.getExecutor(action.exchange);

      if (!executor) {
        throw new Error(
          `[ExecutionManager] CRITICAL: No executor found for exchange: "${action.exchange}". Halting trade.`
        );
      }

      try {
        console.log(`[ExecutionManager] Executing action: ${action.action} ${action.amount} of ${action.pair} on ${action.exchange}`);
        const receipt = await executor.placeOrder(action);
        receipts.push(receipt);

        if (!receipt.success) {
          // The order was rejected by the exchange or failed.
          throw new Error(
            `[ExecutionManager] Order failed on ${action.exchange}: ${receipt.message || 'No message'}`
          );
        }
      } catch (error: any) {
        // This is the critical "Halt and Alert" point.
        // If an action fails, we must immediately stop.
        const errorMessage = `[ExecutionManager] CRITICAL: Legged trade! Action failed on ${action.exchange}. MANUAL INTERVENTION REQUIRED. Opportunity: ${JSON.stringify(opportunity)}. Error: ${error.message}`;
        console.error(errorMessage);
        // Re-throw the error to ensure the application's main loop can catch it and halt.
        throw new Error(errorMessage);
      }
    }

    console.log('[ExecutionManager] Trade opportunity successfully executed.', receipts);
    return receipts;
  }
}