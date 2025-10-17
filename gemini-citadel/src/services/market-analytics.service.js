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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketAnalyticsService = void 0;
const parquetjs_lite_1 = require("parquetjs-lite");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class MarketAnalyticsService {
    constructor() {
        this.dataDir = path.join(__dirname, '..', '..', 'data', 'historical');
    }
    async getHistoricalData(exchange, pair, startTime, endTime, timeframe) {
        const results = [];
        let currentDate = new Date(startTime);
        while (currentDate <= endTime) {
            const year = currentDate.getUTCFullYear();
            const month = (currentDate.getUTCMonth() + 1).toString().padStart(2, '0');
            const day = currentDate.getUTCDate().toString().padStart(2, '0');
            const filePath = path.join(this.dataDir, exchange, pair.replace('/', ''), year.toString(), month, `${day}.parquet`);
            if (fs.existsSync(filePath)) {
                const reader = await parquetjs_lite_1.ParquetReader.openFile(filePath);
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
exports.MarketAnalyticsService = MarketAnalyticsService;
