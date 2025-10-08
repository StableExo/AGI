import { Token } from './Token';

export interface Pool {
  address: string;
  dex: 'UniswapV3' | 'Sushiswap';
  token0: Token;
  token1: Token;
  fee: number;
  sqrtPriceX96: bigint;
  liquidity: bigint;
  tick: number;
}