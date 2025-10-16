import { IMarketAnalyticsService } from './market-analytics.service.interface';
import { IOHLCV } from '../models/IOHLCV';
import { ParquetReader } from 'parquetjs-lite';
import * as path from 'path';
import * as fs from 'fs';

export class MarketAnalyticsService implements IMarketAnalyticsService {
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(__dirname, '..', '..', 'data', 'historical');
  }

  public async getHistoricalData(
    exchange: string,
    pair: string,
    startTime: Date,
    endTime: Date,
    timeframe: '1h' | '1d',
  ): Promise<IOHLCV[]> {
    const results: IOHLCV[] = [];
    let currentDate = new Date(startTime);

    while (currentDate <= endTime) {
      const year = currentDate.getUTCFullYear();
      const month = (currentDate.getUTCMonth() + 1).toString().padStart(2, '0');
      const day = currentDate.getUTCDate().toString().padStart(2, '0');
      const filePath = path.join(
        this.dataDir,
        exchange,
        pair.replace('/', ''),
        year.toString(),
        month,
        `${day}.parquet`,
      );

      if (fs.existsSync(filePath)) {
        const reader = await ParquetReader.openFile(filePath);
        const cursor = reader.getCursor();
        let record = null;
        while ((record = await cursor.next())) {
          if (record.open_time >= startTime.getTime() && record.close_time <= endTime.getTime()) {
            results.push(record);
          }
        }
        await reader.close();
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return results;
  }
}