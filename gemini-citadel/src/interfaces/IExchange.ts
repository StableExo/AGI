import { IFetcher } from './IFetcher';
import { IExecutor } from './IExecutor';

export interface IExchange {
  name: string;
  fetcher: IFetcher;
  executor: IExecutor;
  fee: number;
}