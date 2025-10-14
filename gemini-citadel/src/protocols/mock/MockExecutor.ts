import { IExecutor } from '../../interfaces/IExecutor';
import { ITradeAction } from '../../interfaces/ITradeOpportunity';
import { ITradeReceipt } from '../../interfaces/ITradeReceipt';

export class MockExecutor implements IExecutor {
  public async placeOrder(action: ITradeAction): Promise<ITradeReceipt> {
    console.log(
      `[MockExecutor] Received request to ${action.action} ${action.amount} of ${action.pair} at price ${action.price}`
    );

    // Simulate a successful order execution
    const receipt: ITradeReceipt = {
      success: true,
      orderId: `mock-${Date.now()}`,
      filledAmount: action.amount,
    };

    return Promise.resolve(receipt);
  }
}