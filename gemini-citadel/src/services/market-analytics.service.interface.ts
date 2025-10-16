import { IOHLCV } from '../models/IOHLCV';

export interface IMarketAnalyticsService {
  getHistoricalData(
    exchange: string,
    pair: string,
    startTime: Date,
    endTime: Date,
    timeframe: '1h' | '1d',
  ): Promise<IOHLCV[]>;
}