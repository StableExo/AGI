import { IFetcher } from '../interfaces/IFetcher';
import { ICexFetcher } from '../interfaces/ICexFetcher';
import { IExecutor } from '../interfaces/IExecutor';
import { IExchange } from '../interfaces/IExchange';
import logger from './logger.service';

interface IFetcherEntry {
  instance: IFetcher;
  fee: number;
}

interface ICexFetcherEntry {
  instance: ICexFetcher;
  fee: number;
}

export class ExchangeDataProvider {
  private fetchers: Map<string, IFetcherEntry> = new Map();
  private cexFetchers: Map<string, ICexFetcherEntry> = new Map();
  private executors: Map<string, IExecutor> = new Map();

  constructor(exchanges: IExchange[]) {
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
  public registerFetcher(name: string, fetcher: IFetcher, fee: number): void {
    this.fetchers.set(name, { instance: fetcher, fee });
    logger.info(`[ExchangeDataProvider] Registered DEX fetcher: ${name} with fee: ${fee}`);
  }

  /**
   * Registers a new CEX fetcher with the data provider.
   * @param name - The name of the exchange (e.g., 'btcc').
   * @param fetcher - The CEX fetcher instance.
   * @param fee - The trading fee for this exchange (e.g., 0.001 for 0.1%).
   */
  public registerCexFetcher(name: string, fetcher: ICexFetcher, fee: number): void {
    this.cexFetchers.set(name, { instance: fetcher, fee });
    logger.info(`[ExchangeDataProvider] Registered CEX fetcher: ${name} with fee: ${fee}`);
  }

  /**
   * Registers a new executor with the data provider.
   * @param name - The name of the exchange.
   * @param executor - The executor instance.
   */
  public registerExecutor(name: string, executor: IExecutor): void {
    this.executors.set(name, executor);
    logger.info(`[ExchangeDataProvider] Registered executor: ${name}`);
  }

  /**
   * Gets a DEX fetcher instance by name.
   * @param name - The name of the exchange.
   * @returns The fetcher instance.
   */
  public getFetcher(name: string): IFetcher | undefined {
    return this.fetchers.get(name)?.instance;
  }

  /**
   * Gets a CEX fetcher instance by name.
   * @param name - The name of the exchange.
   * @returns The CEX fetcher instance.
   */
  public getCexFetcher(name: string): ICexFetcher | undefined {
    return this.cexFetchers.get(name)?.instance;
  }

  /**
   * Gets an executor instance by name.
   * @param name - The name of the exchange.
   * @returns The executor instance.
   */
  public getExecutor(name: string): IExecutor | undefined {
    return this.executors.get(name);
  }

  /**
   * Gets the trading fee for a specific DEX exchange.
   * @param name - The name of the exchange.
   * @returns The trading fee.
   */
  public getFee(name: string): number | undefined {
    return this.fetchers.get(name)?.fee;
  }

  /**
   * Gets the trading fee for a specific CEX exchange.
   * @param name - The name of the exchange.
   * @returns The trading fee.
   */
  public getCexFee(name: string): number | undefined {
    return this.cexFetchers.get(name)?.fee;
  }

  /**
   * Gets all registered DEX fetcher instances.
   * @returns A map of all fetcher instances.
   */
  public getAllFetchers(): Map<string, IFetcher> {
    const instances = new Map<string, IFetcher>();
    this.fetchers.forEach((value, key) => {
      instances.set(key, value.instance);
    });
    return instances;
  }

  /**
   * Gets all registered CEX fetcher instances.
   * @returns A map of all CEX fetcher instances.
   */
  public getAllCexFetchers(): Map<string, ICexFetcher> {
    const instances = new Map<string, ICexFetcher>();
    this.cexFetchers.forEach((value, key) => {
      instances.set(key, value.instance);
    });
    return instances;
  }
}