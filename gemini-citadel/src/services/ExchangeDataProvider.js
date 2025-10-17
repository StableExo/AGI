"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeDataProvider = void 0;
const logger_service_1 = __importDefault(require("./logger.service"));
class ExchangeDataProvider {
    constructor(exchanges) {
        this.fetchers = new Map();
        this.cexFetchers = new Map();
        this.executors = new Map();
        exchanges.forEach(exchange => {
            this.registerFetcher(exchange.name, exchange.fetcher, exchange.fee);
            this.registerExecutor(exchange.name, exchange.executor);
        });
    }
    /**
     * Registers a new DEX fetcher with the data provider.
     * @param name - The name of the exchange (e.g., 'uniswap').
     * @param fetcher - The fetcher instance.
     * @param fee - The trading fee for this exchange (e.g., 0.003 for 0.3%).
     */
    registerFetcher(name, fetcher, fee) {
        this.fetchers.set(name, { instance: fetcher, fee });
        logger_service_1.default.info(`[ExchangeDataProvider] Registered DEX fetcher: ${name} with fee: ${fee}`);
    }
    /**
     * Registers a new CEX fetcher with the data provider.
     * @param name - The name of the exchange (e.g., 'btcc').
     * @param fetcher - The CEX fetcher instance.
     * @param fee - The trading fee for this exchange (e.g., 0.001 for 0.1%).
     */
    registerCexFetcher(name, fetcher, fee) {
        this.cexFetchers.set(name, { instance: fetcher, fee });
        logger_service_1.default.info(`[ExchangeDataProvider] Registered CEX fetcher: ${name} with fee: ${fee}`);
    }
    /**
     * Registers a new executor with the data provider.
     * @param name - The name of the exchange.
     * @param executor - The executor instance.
     */
    registerExecutor(name, executor) {
        this.executors.set(name, executor);
        logger_service_1.default.info(`[ExchangeDataProvider] Registered executor: ${name}`);
    }
    /**
     * Gets a DEX fetcher instance by name.
     * @param name - The name of the exchange.
     * @returns The fetcher instance.
     */
    getFetcher(name) {
        return this.fetchers.get(name)?.instance;
    }
    /**
     * Gets a CEX fetcher instance by name.
     * @param name - The name of the exchange.
     * @returns The CEX fetcher instance.
     */
    getCexFetcher(name) {
        return this.cexFetchers.get(name)?.instance;
    }
    /**
     * Gets an executor instance by name.
     * @param name - The name of the exchange.
     * @returns The executor instance.
     */
    getExecutor(name) {
        return this.executors.get(name);
    }
    /**
     * Gets the trading fee for a specific DEX exchange.
     * @param name - The name of the exchange.
     * @returns The trading fee.
     */
    getFee(name) {
        return this.fetchers.get(name)?.fee;
    }
    /**
     * Gets the trading fee for a specific CEX exchange.
     * @param name - The name of the exchange.
     * @returns The trading fee.
     */
    getCexFee(name) {
        return this.cexFetchers.get(name)?.fee;
    }
    /**
     * Gets all registered DEX fetcher instances.
     * @returns A map of all fetcher instances.
     */
    getAllFetchers() {
        const instances = new Map();
        this.fetchers.forEach((value, key) => {
            instances.set(key, value.instance);
        });
        return instances;
    }
    /**
     * Gets all registered CEX fetcher instances.
     * @returns A map of all CEX fetcher instances.
     */
    getAllCexFetchers() {
        const instances = new Map();
        this.cexFetchers.forEach((value, key) => {
            instances.set(key, value.instance);
        });
        return instances;
    }
}
exports.ExchangeDataProvider = ExchangeDataProvider;
