import { IFetcher } from '../interfaces/IFetcher';

export class ExchangeDataProvider {
  private fetchers: Map<string, IFetcher> = new Map();

  constructor(fetcherInstances: { name: string; instance: IFetcher }[]) {
    fetcherInstances.forEach(fetcher => {
      this.registerFetcher(fetcher.name, fetcher.instance);
    });
  }

  /**
   * Registers a new fetcher with the data provider.
   * @param name - The name of the exchange (e.g., 'btcc').
   * @param fetcher - The fetcher instance.
   */
  public registerFetcher(name: string, fetcher: IFetcher): void {
    this.fetchers.set(name, fetcher);
    console.log(`[ExchangeDataProvider] Registered fetcher: ${name}`);
  }

  /**
   * Gets a fetcher instance by name.
   * @param name - The name of the exchange.
   * @returns The fetcher instance.
   */
  public getFetcher(name: string): IFetcher | undefined {
    return this.fetchers.get(name);
  }

  /**
   * Gets all registered fetcher instances.
   * @returns A map of all fetcher instances.
   */
  public getAllFetchers(): Map<string, IFetcher> {
    return this.fetchers;
  }
}