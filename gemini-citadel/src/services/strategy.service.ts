import { Pool } from '../interfaces/Pool';
import { Price, Token, Fraction } from '@uniswap/sdk-core';
import { DataService } from './data.service';

// Define the structure of the pool configuration from pools.config.json
interface PoolConfig {
  name: string;
  address: string;
  tokenA: string;
  tokenB: string;
  fee: number;
}

export interface Opportunity {
  type: 'arbitrage';
  profit: number; // Represents the percentage difference
  path: [Pool, Pool]; // A clear path from low price pool to high price pool
}

export class StrategyEngine {
  private dataService: DataService;
  private poolsConfig: PoolConfig[];

  constructor(dataService: DataService, poolsConfig: PoolConfig[]) {
    console.log('[StrategyEngine] Initialized.');
    this.dataService = dataService;
    this.poolsConfig = poolsConfig;
  }

  private getPoolPrice(pool: Pool): Price<Token, Token> {
    const token0 = new Token(1, pool.token0.address, pool.token0.decimals, pool.token0.symbol);
    const token1 = new Token(1, pool.token1.address, pool.token1.decimals, pool.token1.symbol);

    // Uniswap SDK price is token1 / token0. The price is represented as a fraction.
    // The pool's sqrtPriceX96 is a Q64.96 fixed-point number.
    // price = (sqrtPriceX96 / 2^96)^2
    // To avoid floating point issues, we work with the squared value.
    // price = sqrtPriceX96^2 / (2^96)^2 = sqrtPriceX96^2 / 2^192
    // The Price constructor takes the numerator and denominator.
    return new Price(
      token0,
      token1,
      (1n << 192n).toString(), // Denominator: 2^192
      (pool.sqrtPriceX96 * pool.sqrtPriceX96).toString() // Numerator: sqrtPriceX96^2
    );
  }

  // This internal method contains the original analysis logic
  private analyzePools(pools: Pool[]): Opportunity[] {
    console.log(`[StrategyEngine] Analyzing ${pools.length} pools for opportunities...`);
    const opportunities: Opportunity[] = [];

    if (pools.length < 2) {
      console.log('[StrategyEngine] Not enough pools to analyze for arbitrage.');
      return opportunities;
    }

    for (let i = 0; i < pools.length; i++) {
      for (let j = i + 1; j < pools.length; j++) {
        const poolA = pools[i];
        const poolB = pools[j];

        const samePair = (poolA.token0.address === poolB.token0.address && poolA.token1.address === poolB.token1.address) ||
                         (poolA.token0.address === poolB.token1.address && poolA.token1.address === poolB.token0.address);

        if (samePair) {
          const priceA = this.getPoolPrice(poolA);
          const priceB = this.getPoolPrice(poolB);

          if (priceA.equalTo(priceB)) continue;

          // Use robust fractional math for comparison
          const priceDifference = priceA.greaterThan(priceB)
            ? priceA.subtract(priceB).divide(priceB)
            : priceB.subtract(priceA).divide(priceA);

          const threshold = new Fraction(1, 1000); // 0.1% arbitrage threshold

          if (priceDifference.greaterThan(threshold)) {
            console.log(`!!! Potential Arbitrage Found for pair ${poolA.token0.symbol}/${poolA.token1.symbol} between pools ${poolA.address} and ${poolB.address}`);
            console.log(`    Price A: ${priceA.toSignificant(6)}, Price B: ${priceB.toSignificant(6)}, Difference: ${priceDifference.toFixed(4)}%`);

            // Sort the path by price to create a clear "buy low, sell high" path
            const path: [Pool, Pool] = priceA.lessThan(priceB) ? [poolA, poolB] : [poolB, poolA];

            opportunities.push({
              type: 'arbitrage',
              profit: parseFloat(priceDifference.toSignificant(4)),
              path: path
            });
          }
        }
      }
    }
    return opportunities;
  }

  public async findOpportunities(): Promise<Opportunity[]> {
    console.log(`[StrategyEngine] Fetching live data for ${this.poolsConfig.length} configured pools...`);
    try {
      const poolDataPromises = this.poolsConfig.map(p => this.dataService.getV3PoolData(p.address));
      const pools = await Promise.all(poolDataPromises);
      console.log(`[StrategyEngine] Successfully fetched data for ${pools.length} pools.`);
      return this.analyzePools(pools);
    } catch (error) {
      console.error('[StrategyEngine] Failed to fetch pool data.', error);
      // Re-throw the error to be caught by the AppController's loop
      throw error;
    }
  }
}