// gemini-citadel/src/havoc-core/core/ArbitrageEngine.ts
import { Provider } from 'ethers';
import { UniswapV3Fetcher } from './fetchers/UniswapV3Fetcher';
import { IPoolData } from './interfaces/IPoolData';
import { ArbitrageOpportunity } from '../../models/ArbitrageOpportunity';
import logger from '../../services/logger.service';
import { Token } from '@uniswap/sdk-core';
import { SpatialFinder } from './finders/SpatialFinder';

export class ArbitrageEngine {
  private provider: Provider;
  private fetcher: UniswapV3Fetcher;
  private finder: SpatialFinder;

  constructor(provider: Provider, fetcher: UniswapV3Fetcher) {
    this.provider = provider;
    this.fetcher = fetcher;
    this.finder = new SpatialFinder();
  }

  public async runCycle(poolConfigs: { address: string; pair: [Token, Token] }[]): Promise<ArbitrageOpportunity[]> {
    logger.info('[ArbitrageEngine] Starting new arbitrage cycle...');

    try {
      // 1. Fetch latest pool data
      const fetchResults = await Promise.all(
        poolConfigs.map(config => this.fetcher.fetchPoolData(config.address, config.pair))
      );

      const successfulFetches = fetchResults
        .filter(result => result.success && result.poolData)
        .map(result => result.poolData!);

      if (successfulFetches.length === 0) {
        logger.info('[ArbitrageEngine] No valid pool data fetched in this cycle.');
        return [];
      }

      // 2. Find potential arbitrage opportunities
      const opportunities = this.finder.findArbitrage(successfulFetches);

      if (opportunities.length === 0) {
        logger.info('[ArbitrageEngine] No arbitrage opportunities found in this cycle.');
      } else {
        logger.info(`[ArbitrageEngine] Found ${opportunities.length} arbitrage opportunities!`);
        opportunities.forEach(opp => {
          logger.info(`  - Profit: ${opp.profit}`);
          opp.tradeActions.forEach(action => {
            logger.info(`    - ${action.action} on ${action.exchange} at ${action.price}`);
          });
        });
      }

      logger.info('[ArbitrageEngine] Arbitrage cycle completed successfully.');
      return opportunities;

    } catch (error: any) {
      logger.error('[ArbitrageEngine] An error occurred during the arbitrage cycle:', error);
      return [];
    }
  }
}
