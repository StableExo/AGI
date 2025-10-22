// gemini-citadel/src/havoc-core/core/interfaces/IPoolData.ts
import { Token } from '@uniswap/sdk-core';

export interface IPoolData {
  address: string;
  dexType: 'uniswapV3';
  fee: number;
  tick: number;
  liquidity: bigint;
  sqrtPriceX96: bigint;
  tickSpacing: number;
  token0: Token;
  token1: Token;
  token0Symbol: string;
  token1Symbol: string;
  groupName: string;
  pairKey: string;
  timestamp: number;
}
