import { ITradeAction } from '../models/ITradeAction';
import { ITradeReceipt } from './ITradeReceipt';


export interface IBalance {
  [currency: string]: number; // e.g., { 'BTC': 0.5, 'USDT': 10000 }
}

export interface ICexExecutor {
  exchangeId: string;
  placeOrder(order: ITradeAction): Promise<ITradeReceipt>;
  getOrderStatus(orderId: string, pairSymbol: string): Promise<any>; // to be defined
  getBalances(): Promise<IBalance>;
}