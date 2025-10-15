export interface ITradeAction {
  action: 'Buy' | 'Sell';
  exchange: string;
  pair: string;
  price: number;
  amount: number;
}