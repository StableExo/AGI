// gemini-citadel/src/havoc-core/core/interfaces/IFetcher.ts
import { Token } from '@uniswap/sdk-core';
import { IPoolData } from './IPoolData';

export interface IFetcher {
  fetchPoolData(address: string, pair: [Token, Token]): Promise<{ success: boolean; poolData: IPoolData | null; error: string | null }>;
}
