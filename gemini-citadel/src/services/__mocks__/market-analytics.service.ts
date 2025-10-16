import { IMarketAnalyticsService } from '../market-analytics.service.interface';
import { IOHLCV } from '../../models/IOHLCV';

export class MockMarketAnalyticsService implements IMarketAnalyticsService {
  public getHistoricalData(
    exchange: string,
    pair: string,
    startTime: Date,
    endTime: Date,
    timeframe: '1h' | '1d',
  ): Promise<IOHLCV[]> {
    const data: IOHLCV[] = [];
    let currentTime = startTime.getTime();
    while (currentTime <= endTime.getTime()) {
      data.push({
        open_time: currentTime,
        open: 100,
        high: 110,
        low: 90,
        close: 105,
        volume: 1000,
        close_time: currentTime + 3600000 - 1,
      });
      currentTime += 3600000;
    }
    return Promise.resolve(data);
  }
}