import { ITradeAction } from './ITradeAction';
import { ITradeReceipt } from './ITradeReceipt';

export interface IExecutor {
  /**
   * Places an order on the exchange.
   * @param action - The trade action to execute.
   * @returns A promise that resolves with a trade receipt.
   */
  placeOrder(action: ITradeAction): Promise<ITradeReceipt>;
}