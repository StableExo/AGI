import { IFetcher } from '../interfaces/IFetcher';
import { IExecutor } from '../interfaces/IExecutor';
import { IExchange } from '../interfaces/IExchange';
import logger from './logger.service';

interface IFetcherEntry {
  instance: IFetcher;
  fee: number;
}

export class ExchangeDataProvider {
  private fetchers: Map<string, IFetcherEntry> = new Map();
  private executors: Map<string, IExecutor> = new Map();

  constructor(exchanges: IExchange[]) {
    exchanges.forEach(exchange => {
      this.registerFetcher(exchange.name, exchange.fetcher, exchange.fee);
      this.registerExecutor(exchange.name, exchange.executor);
    });
  }

  /**
   * Registers a new fetcher with the data provider.
   * @param name - The name of the exchange (e.g., 'btcc').
   * @param fetcher - The fetcher instance.
   * @param fee - The trading fee for this exchange (e.g., 0.001 for 0.1%).
   */
  public registerFetcher(name: string, fetcher: IFetcher, fee: number): void {
    this.fetchers.set(name, { instance: fetcher, fee });
    logger.info(`[ExchangeDataProvider] Registered fetcher: ${name} with fee: ${fee}`);
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
   * Gets a fetcher instance by name.
   * @param name - The name of the exchange.
   * @returns The fetcher instance.
   */
  public getFetcher(name: string): IFetcher | undefined {
    return this.fetchers.get(name)?.instance;
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
   * Gets the trading fee for a specific exchange.
   * @param name - The name of the exchange.
   * @returns The trading fee.
   */
  public getFee(name: string): number | undefined {
    return this.fetchers.get(name)?.fee;
  }

  /**
   * Gets all registered fetcher instances.
   * @returns A map of all fetcher instances.
   */
  public getAllFetchers(): Map<string, IFetcher> {
    const instances = new Map<string, IFetcher>();
    this.fetchers.forEach((value, key) => {
      instances.set(key, value.instance);
    });
    return instances;
  }
}