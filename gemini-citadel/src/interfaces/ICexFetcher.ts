import { ITradePair } from './ITradePair';

export interface ITicker {
  price: number;
  volume: number;
}

export interface IOrderBook {
  bids: [number, number][]; // [price, quantity]
  asks: [number, number][]; // [price, quantity]
}

export interface ICexFetcher {
  exchangeId: string;
  getTicker(pair: ITradePair): Promise<ITicker>;
  getOrderBook(pair: ITradePair): Promise<IOrderBook>;
}