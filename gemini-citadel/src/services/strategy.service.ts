import { Pool } from '../interfaces/Pool';
import { Price, Token, Fraction } from '@uniswap/sdk-core';

export interface Opportunity {
  type: 'arbitrage';
  profit: number; // Placeholder for now
  path: [Pool, Pool];
}

export class StrategyEngine {
  constructor() {
    console.log('[StrategyEngine] Initialized.');
  }

  private getPoolPrice(pool: Pool): Price<Token, Token> {
    const token0 = new Token(1, pool.token0.address, pool.token0.decimals, pool.token0.symbol);
    const token1 = new Token(1, pool.token1.address, pool.token1.decimals, pool.token1.symbol);

    // Corrected implementation: Uniswap SDK price is token1 / token0
    return new Price(
      token0,
      token1,
      (1n << 192n).toString(),
      (pool.sqrtPriceX96 * pool.sqrtPriceX96).toString()
    );
  }

  public findOpportunities(pools: Pool[]): Opportunity[] {
    console.log(`[StrategyEngine] Analyzing ${pools.length} pools for opportunities...`);
    const opportunities: Opportunity[] = [];

    for (let i = 0; i < pools.length; i++) {
      for (let j = i + 1; j < pools.length; j++) {
        const poolA = pools[i];
        const poolB = pools[j];

        const samePair = (poolA.token0.address === poolB.token0.address && poolA.token1.address === poolB.token1.address) ||
                         (poolA.token0.address === poolB.token1.address && poolA.token1.address === poolB.token0.address);

        if (samePair) {
          const priceA = this.getPoolPrice(poolA);
          const priceB = this.getPoolPrice(poolB);

          // Use robust fractional math for comparison
          const priceDifference = priceA.greaterThan(priceB)
            ? priceA.subtract(priceB).divide(priceB)
            : priceB.subtract(priceA).divide(priceA);

          const threshold = new Fraction(1, 1000); // 0.1%
          // Check if the percentage difference exceeds a threshold (e.g., 0.1%)
          if (priceDifference.greaterThan(threshold)) {
            console.log(`!!! Potential Arbitrage Found between pools with pair ${poolA.token0.symbol}/${poolA.token1.symbol}`);
            console.log(`    Price A: ${priceA.toSignificant(6)}, Price B: ${priceB.toSignificant(6)}`);

            opportunities.push({
              type: 'arbitrage',
              profit: parseFloat(priceDifference.toSignificant(4)),
              path: [poolA, poolB].sort((a,b) => parseFloat(this.getPoolPrice(a).toSignificant(6)) - parseFloat(this.getPoolPrice(b).toSignificant(6))) as [Pool, Pool]
            });
          }
        }
      }
    }
    return opportunities;
  }
}