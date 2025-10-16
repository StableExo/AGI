import { ITradePair } from './ITradePair';

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'LIMIT' | 'MARKET';
export type OrderStatus = 'OPEN' | 'CLOSED' | 'CANCELLED' | 'FAILED';

export interface ICexOrder {
  id?: string; // Exchange-specific order ID
  pair: ITradePair;
  side: OrderSide;
  type: OrderType;
  amount: number; // The amount of the base currency to buy or sell
  price?: number; // Required for LIMIT orders
  status: OrderStatus;
  createdAt: number; // Timestamp
}