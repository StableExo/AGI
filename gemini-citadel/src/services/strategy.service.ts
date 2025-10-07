// gemini-citadel/src/services/strategy.service.ts
import { DataService } from './data.service';
import { Pool, Opportunity } from '../types';

/**
 * @class StrategyService
 * @description The brain of the operation. Analyzes market data to find
 * profitable arbitrage opportunities.
 */
export class StrategyService {
  private dataService: DataService;

  constructor(dataService: DataService) {
    this.dataService = dataService;
  }

  /**
   * Finds arbitrage opportunities by comparing prices across different pools.
   * @param {Pool[]} pools - A list of pools with their current prices.
   * @returns {Opportunity[]} A list of identified profitable opportunities.
   */
  public findArbitrageOpportunities(pools: Pool[]): Opportunity[] {
    console.log('[StrategyService] Evaluating market data for arbitrage opportunities...');
    const opportunities: Opportunity[] = [];

    // Simple O(n^2) comparison for demonstration purposes.
    for (let i = 0; i < pools.length; i++) {
      for (let j = i + 1; j < pools.length; j++) {
        const poolA = pools[i];
        const poolB = pools[j];

        // Check if both pools are for the same token pair (in any order)
        const isSamePair =
          (poolA.tokenA.symbol === poolB.tokenA.symbol && poolA.tokenB.symbol === poolB.tokenB.symbol) ||
          (poolA.tokenA.symbol === poolB.tokenB.symbol && poolA.tokenB.symbol === poolB.tokenA.symbol);

        if (isSamePair) {
          // Simple price comparison
          if (poolB.price > poolA.price) {
            const profitMargin = (poolB.price - poolA.price) / poolA.price;
            opportunities.push({
              buyPool: poolA,
              sellPool: poolB,
              profitMargin: profitMargin,
            });
          } else if (poolA.price > poolB.price) {
            const profitMargin = (poolA.price - poolB.price) / poolB.price;
            opportunities.push({
              buyPool: poolB,
              sellPool: poolA,
              profitMargin: profitMargin,
            });
          }
        }
      }
    }
    console.log(`[StrategyService] Found ${opportunities.length} potential opportunities.`);
    return opportunities;
  }
}