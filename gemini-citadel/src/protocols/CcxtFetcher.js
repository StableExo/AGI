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
exports.CcxtFetcher = void 0;
const ccxt = __importStar(require("ccxt"));
const logger_service_1 = __importDefault(require("../services/logger.service"));
class CcxtFetcher {
    constructor(exchangeId, apiKey, apiSecret) {
        // Cast ccxt.pro to any to allow dynamic exchange loading by string key.
        const exchangeMap = ccxt.pro;
        if (!exchangeMap[exchangeId]) {
            throw new Error(`Exchange '${exchangeId}' is not supported by CCXT.`);
        }
        this.exchangeId = exchangeId;
        // Let TypeScript infer the options type.
        const exchangeOptions = {
            apiKey,
            secret: apiSecret,
        };
        this.exchange = new exchangeMap[exchangeId](exchangeOptions);
    }
    async getTicker(pair) {
        const symbol = `${pair.base}/${pair.quote}`;
        try {
            const ticker = await this.exchange.fetchTicker(symbol);
            if (!ticker || !ticker.last) {
                throw new Error(`Ticker for ${symbol} on ${this.exchangeId} is undefined or has no last price.`);
            }
            return {
                price: ticker.last,
                volume: ticker.baseVolume || 0,
            };
        }
        catch (error) {
            logger_service_1.default.error(`[CcxtFetcher] Error fetching ticker for ${symbol} on ${this.exchangeId}:`, error);
            throw error;
        }
    }
    async getOrderBook(pair) {
        // This method is not required for the initial implementation.
        // We will implement it in a future development cycle.
        throw new Error('Method not implemented.');
    }
}
exports.CcxtFetcher = CcxtFetcher;
