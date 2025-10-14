import { ITradeOpportunity } from './ITradeOpportunity';

/**
 * @interface IOrderBuilder
 * @description Defines the standard for building execution logic for a trade.
 * In a live trading scenario, this would create and sign transactions or API orders.
 * In the current "Log-Only" phase, it will generate a detailed log message.
 */
export interface IOrderBuilder {
  /**
   * Builds the execution logic for a given trade opportunity.
   * @param opportunity - The trade opportunity to execute.
   * @returns A promise that resolves to a string representing the execution action.
   *          In "Log-Only" mode, this is a descriptive string for logging.
   *          In a live system, this might be a transaction hash or an order ID.
   */
  buildOrder(opportunity: ITradeOpportunity): Promise<string>;
}