import { IFetcher } from '../interfaces/IFetcher';
import { IExecutor } from '../interfaces/IExecutor';

interface IFetcherEntry {
  instance: IFetcher;
  fee: number;
}

export class ExchangeDataProvider {
  private fetchers: Map<string, IFetcherEntry> = new Map();
  private executors: Map<string, IExecutor> = new Map();

  constructor(
    fetcherInstances: { name: string; instance: IFetcher; fee: number }[],
    executorInstances: { name: string; instance: IExecutor }[]
  ) {
    fetcherInstances.forEach(fetcher => {
      this.registerFetcher(fetcher.name, fetcher.instance, fetcher.fee);
    });
    executorInstances.forEach(executor => {
      this.registerExecutor(executor.name, executor.instance);
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
    console.log(`[ExchangeDataProvider] Registered fetcher: ${name} with fee: ${fee}`);
  }

  /**
   * Registers a new executor with the data provider.
   * @param name - The name of the exchange.
   * @param executor - The executor instance.
   */
  public registerExecutor(name: string, executor: IExecutor): void {
    this.executors.set(name, executor);
    console.log(`[ExchangeDataProvider] Registered executor: ${name}`);
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