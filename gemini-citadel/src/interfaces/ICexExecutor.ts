import { ICexOrder } from './ICexOrder';

export interface IBalance {
  [currency: string]: number; // e.g., { 'BTC': 0.5, 'USDT': 10000 }
}

export interface ICexExecutor {
  exchangeId: string;
  placeOrder(order: ICexOrder): Promise<ICexOrder>;
  getOrderStatus(orderId: string, pairSymbol: string): Promise<ICexOrder>;
  getBalances(): Promise<IBalance>;
}