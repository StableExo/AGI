export interface ITradeOpportunity {
  type: 'Arbitrage';
  actions: ITradeAction[];
  estimatedProfit: number;
  // Can be extended with more metadata like risk assessment, etc.
}

export interface ITradeAction {
  action: 'Buy' | 'Sell';
  exchange: string; // e.g., 'btcc', 'uniswap_v3'
  pair: string; // e.g., 'BTC/USDT'
  price: number;
  amount: number;
}