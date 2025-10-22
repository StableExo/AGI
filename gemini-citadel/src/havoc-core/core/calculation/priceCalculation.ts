// gemini-citadel/src/havoc-core/core/calculation/priceCalculation.ts
import { Token } from '@uniswap/sdk-core';
import { IPoolData } from '../interfaces/IPoolData';

const Q96 = 2n ** 96n;

export class PriceV3 {
  public readonly sqrtPriceX96: bigint;
  public readonly token0: Token;
  public readonly token1: Token;

  constructor(sqrtPriceX96: bigint, token0: Token, token1: Token) {
    this.sqrtPriceX96 = sqrtPriceX96;
    this.token0 = token0;
    this.token1 = token1;
  }

  public lessThan(other: PriceV3): boolean {
    return this.sqrtPriceX96 < other.sqrtPriceX96;
  }

  public quote(token: Token): number {
    const priceX96 = (this.sqrtPriceX96 * this.sqrtPriceX96) / Q96;
    const price = Number(priceX96) / Number(Q96);
    if (token.address === this.token0.address) {
      return 1 / price;
    } else {
      return price;
    }
  }
}

export function getPriceForAmount(amountIn: bigint, pool: IPoolData): { amountOut: bigint } {
  const price = new PriceV3(pool.sqrtPriceX96, pool.token0, pool.token1);
  const quote = price.quote(pool.token1);
  const amountOut = (Number(amountIn) * quote);
  return { amountOut: BigInt(Math.floor(amountOut)) };
}
