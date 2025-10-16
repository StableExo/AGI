import { Ticker } from 'ccxt';

export interface IExchangeDataProvider {
    getTicker(exchange: string, pair: string): Promise<Ticker>;
}