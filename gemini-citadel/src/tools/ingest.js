"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ccxt_1 = __importDefault(require("ccxt"));
const parquetjs_lite_1 = require("parquetjs-lite");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Define the schema for our Parquet file
const schema = new parquetjs_lite_1.ParquetSchema({
    open_time: { type: 'INT64' },
    open: { type: 'DOUBLE' },
    high: { type: 'DOUBLE' },
    low: { type: 'DOUBLE' },
    close: { type: 'DOUBLE' },
    volume: { type: 'DOUBLE' },
    close_time: { type: 'INT64' },
});
// Function to get historical data from an exchange using ccxt
async function getHistoricalData(exchange, symbol, timeframe, since, limit) {
    if (exchange.has['fetchOHLCV']) {
        const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, since, limit);
        // ccxt returns OHLCV data with the close time being the start of the next candle.
        // We will adjust it to be the end of the current candle.
        return ohlcv.map((k) => [k[0], k[1], k[2], k[3], k[4], k[5], k[0] + (exchange.parseTimeframe(timeframe) * 1000) - 1]);
    }
    return [];
}
// Function to write data to a Parquet file
async function writeParquetFile(filePath, data) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const writer = await parquetjs_lite_1.ParquetWriter.openFile(schema, filePath);
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
async function ingestData(exchangeName, pair, startDate, endDate) {
    console.log(`Ingesting data for ${pair} on ${exchangeName} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    const exchange = new ccxt_1.default[exchangeName]();
    const timeframe = '1h';
    const limit = 1000;
    let currentStartTime = startDate.getTime();
    const endTime = endDate.getTime();
    while (currentStartTime < endTime) {
        const data = await getHistoricalData(exchange, pair, timeframe, currentStartTime, limit);
        if (data.length === 0) {
            break;
        }
        const dataByDay = {};
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
            const filePath = path.join(__dirname, '..', '..', 'data', 'historical', exchangeName, pair.replace('/', ''), year, month, `${day}.parquet`);
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
    for (const pair of pairs) {
        await ingestData(exchange, pair, startDate, endDate);
    }
}
main().catch(console.error);
