export interface ITradeAction {
    exchange: string;
    pair: string;
    action: 'BUY' | 'SELL';
    price: number;
    amount: number;
    // Optional fields for DEX trades
    tokenIn?: string;
    tokenOut?: string;
    poolFee?: number;
}