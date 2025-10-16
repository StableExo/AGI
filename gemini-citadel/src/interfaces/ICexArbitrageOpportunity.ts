import { ITradePair } from './ITradePair';

export interface ICexArbitrageOpportunity {
  pair: ITradePair;
  buyOn: string; // Exchange ID to buy from
  sellOn: string; // Exchange ID to sell to
  buyPrice: number;
  sellPrice: number;
  potentialProfit: number; // Profit in the quote currency (e.g., USDT)
}