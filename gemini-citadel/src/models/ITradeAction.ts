export interface ITradeAction {
    exchange: string;
    pair: string;
    action: 'BUY' | 'SELL';
    price: number;
    amount: number;
}