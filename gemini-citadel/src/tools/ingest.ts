import ccxt, { Exchange } from 'ccxt';
import { ParquetWriter, ParquetSchema } from 'parquetjs-lite';
import * as fs from 'fs';
import * as path from 'path';

// Define the schema for our Parquet file
const schema = new ParquetSchema({
  open_time: { type: 'INT64' },
  open: { type: 'DOUBLE' },
  high: { type: 'DOUBLE' },
  low: { type: 'DOUBLE' },
  close: { type: 'DOUBLE' },
  volume: { type: 'DOUBLE' },
  close_time: { type: 'INT64' },
});

// Function to get historical data from an exchange using ccxt
async function getHistoricalData(exchange: Exchange, symbol: string, timeframe: string, since: number, limit: number) {
  if (exchange.has['fetchOHLCV']) {
    const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, since, limit);
    // ccxt returns OHLCV data with the close time being the start of the next candle.
    // We will adjust it to be the end of the current candle.
    return ohlcv.map((k: any) => [k[0], k[1], k[2], k[3], k[4], k[5], k[0] + (exchange.parseTimeframe(timeframe) * 1000) - 1]);
  }
  return [];
}


// Function to write data to a Parquet file
async function writeParquetFile(filePath: string, data: any[]) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const writer = await ParquetWriter.openFile(schema, filePath);

  for (const row of data) {
    await writer.appendRow({
      open_time: row[0],
      open: row[1],
      high: row[2],
      low: row[3],
      close: row[4],
      volume: row[5],
      close_time: row[6],
    });
  }

  await writer.close();
}

// Main function to ingest data for a given pair
async function ingestData(exchangeName: string, pair: string, startDate: Date, endDate: Date) {
  console.log(`Ingesting data for ${pair} on ${exchangeName} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

  const exchange = new (ccxt as any)[exchangeName]();
  const timeframe = '1h';
  const limit = 1000;
  let currentStartTime = startDate.getTime();
  const endTime = endDate.getTime();

  while (currentStartTime < endTime) {
    const data = await getHistoricalData(exchange, pair, timeframe, currentStartTime, limit);
    if (data.length === 0) {
      break;
    }

    const dataByDay: { [key: string]: any[] } = {};
    for (const row of data) {
      const date = new Date(row[0]);
      const dayString = `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCDate().toString().padStart(2, '0')}`;
      if (!dataByDay[dayString]) {
        dataByDay[dayString] = [];
      }
      dataByDay[dayString].push(row);
    }

    for (const dayString in dataByDay) {
        const [year, month, day] = dayString.split('-');
        const filePath = path.join(
            __dirname,
            '..',
            '..',
            'data',
            'historical',
            exchangeName,
            pair.replace('/', ''),
            year,
            month,
            `${day}.parquet`
        );
        console.log(`Writing to ${filePath}`);
        await writeParquetFile(filePath, dataByDay[dayString]);
    }

    currentStartTime = data[data.length - 1][0] + (exchange.parseTimeframe(timeframe) * 1000);
  }
  console.log(`Finished ingesting data for ${pair}`);
}

// Run the ingestion
async function main() {
    const pairs = ['BTC/USDT', 'ETH/USDT'];
    const exchange = 'kraken';
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30); // Ingest last 30 days of data

    for(const pair of pairs) {
        await ingestData(exchange, pair, startDate, endDate);
    }
}

main().catch(console.error);