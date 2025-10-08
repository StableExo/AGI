import { Pool } from '../interfaces/Pool';
import { Price, Token } from '@uniswap/sdk-core';

export interface Opportunity {
  type: 'arbitrage';
  profit: number; // In terms of token0
  path: [Pool, Pool]; // Simple A -> B path for now
}

export class StrategyEngine {
  constructor() {
    console.log('[StrategyEngine] Initialized.');
  }

  /**
   * Calculates the price of token0 in terms of token1 for a given V3 pool.
   */
  private getPoolPrice(pool: Pool): Price<Token, Token> {
    const token0 = new Token(1, pool.token0.address, pool.token0.decimals, pool.token0.symbol);
    const token1 = new Token(1, pool.token1.address, pool.token1.decimals, pool.token1.symbol);

    // The Uniswap SDK can create a price object from the raw sqrtPriceX96
    // We convert the bigints to strings to avoid type conflicts with BigintIsh.
    // The Uniswap sqrtPriceX96 is the price of token1 in terms of token0.
    // To get the price of token0 in terms of token1, we must invert this ratio.
    return new Price(
      token0,
      token1,
      (pool.sqrtPriceX96 * pool.sqrtPriceX96).toString(),
      (1n << 192n).toString()
    );
  }

  public findOpportunities(pools: Pool[]): Opportunity[] {
    console.log(`[StrategyEngine] Analyzing ${pools.length} pools for opportunities...`);
    const opportunities: Opportunity[] = [];

    // Naive O(n^2) search. This is fine for a small number of pools.
    for (let i = 0; i < pools.length; i++) {
      for (let j = i + 1; j < pools.length; j++) {
        const poolA = pools[i];
        const poolB = pools[j];

        // Check if pools have the same token pair (in any order)
        const samePair = (poolA.token0.address === poolB.token0.address && poolA.token1.address === poolB.token1.address) ||
                         (poolA.token0.address === poolB.token1.address && poolA.token1.address === poolB.token0.address);

        if (samePair) {
          const priceA = this.getPoolPrice(poolA);
          const priceB = this.getPoolPrice(poolB);

          // More robust price comparison using fractional math to avoid floating point inaccuracies.
          const priceRatio = priceA.asFraction.divide(priceB.asFraction);
          const priceDifferencePercentage = Math.abs(1 - parseFloat(priceRatio.toSignificant(6)));

          // A threshold of 0.01% for the price difference
          if (priceDifferencePercentage > 0.0001) {
            console.log(`!!! Potential Arbitrage Found between pools with pair ${poolA.token0.symbol}/${poolA.token1.symbol}`);
            console.log(`    Price A: ${priceA.toSignificant(6)}, Price B: ${priceB.toSignificant(6)}`);
            console.log(`    Percentage Difference: ${(priceDifferencePercentage * 100).toFixed(4)}%`);

            opportunities.push({
              type: 'arbitrage',
              profit: priceDifferencePercentage, // Use percentage as a better profit metric for now
              path: [poolA, poolB]
            });
          }
        }
      }
    }
    return opportunities;
  }
}