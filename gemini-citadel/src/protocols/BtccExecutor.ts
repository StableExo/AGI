import { ICexExecutor, IBalance } from '../interfaces/ICexExecutor';
import { ICexOrder, OrderStatus } from '../interfaces/ICexOrder';
import { botConfig } from '../config/bot.config';
import logger from '../services/logger.service';

// Basic implementation, will be expanded upon.
export class BtccExecutor implements ICexExecutor {
  public readonly exchangeId = 'btcc';
  private readonly executionMode = process.env.EXECUTION_MODE;

  public async placeOrder(order: ICexOrder): Promise<ICexOrder> {
    if (this.executionMode === 'DRY_RUN') {
      logger.info(`[BtccExecutor-DRY_RUN] Intended to place ${order.side} ${order.type} order for ${order.amount} ${order.pair.base} at price ${order.price}`);
      return { ...order, id: 'dry-run-order-id', status: 'OPEN' };
    }

    // Placeholder for live order placement logic.
    // A real implementation would make an authenticated API call to BTCC.
    logger.warn(`[BtccExecutor] Live order placement is not yet implemented.`);
    // In a real scenario, we would get a real order ID from the exchange.
    const newOrder: ICexOrder = { ...order, id: `live-order-${Date.now()}`, status: 'OPEN' };
    return newOrder;
  }

  public async getOrderStatus(orderId: string): Promise<ICexOrder> {
    // Placeholder for order status logic.
    logger.warn(`[BtccExecutor] getOrderStatus is not yet implemented.`);
    throw new Error('getOrderStatus not implemented');
  }

  public async getBalances(): Promise<IBalance> {
    // Placeholder for balance fetching logic.
    logger.warn(`[BtccExecutor] getBalances is not yet implemented.`);
    return {};
  }
}