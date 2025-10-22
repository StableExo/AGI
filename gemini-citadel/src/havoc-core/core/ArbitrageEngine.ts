// gemini-citadel/src/havoc-core/core/ArbitrageEngine.ts
import { Provider } from 'ethers';
import { UniswapV3Fetcher } from './fetchers/UniswapV3Fetcher';
import { IPoolData } from './interfaces/IPoolData';
import { ArbitrageOpportunity } from '../../models/ArbitrageOpportunity';
import logger from '../../services/logger.service';
import { Token } from '@uniswap/sdk-core';
import { SpatialFinder } from './finders/SpatialFinder';
import { SwapSimulator } from '../../core/swapSimulator';

export class ArbitrageEngine {
  private provider: Provider;
  private fetcher: UniswapV3Fetcher;
  private finder: SpatialFinder;
  private simulator: SwapSimulator;

  constructor(provider: Provider, fetcher: UniswapV3Fetcher, simulator: SwapSimulator) {
    this.provider = provider;
    this.fetcher = fetcher;
    this.finder = new SpatialFinder();
    this.simulator = simulator;
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
      const simulatedOpportunities: ArbitrageOpportunity[] = [];

      for (const opp of opportunities) {
        const [buyAction, sellAction] = opp.tradeActions;
        const buyPool = successfulFetches.find(p => p.address === buyAction.exchange);
        const sellPool = successfulFetches.find(p => p.address === sellAction.exchange);

        if (buyPool && sellPool && buyAction.tokenIn && sellAction.tokenIn) {
          const tokenInBuy = buyPool.token0.address === buyAction.tokenIn ? buyPool.token0 : buyPool.token1;
          const sim = await this.simulator.simulateV3Swap(buyPool, tokenInBuy, BigInt(buyAction.amount));
          if (sim.success && sim.amountOut) {
            const tokenInSell = sellPool.token0.address === sellAction.tokenIn ? sellPool.token0 : sellPool.token1;
            const sim2 = await this.simulator.simulateV3Swap(sellPool, tokenInSell, sim.amountOut);
            if (sim2.success && sim2.amountOut && sim2.amountOut > BigInt(buyAction.amount)) {
              opp.profit = Number(sim2.amountOut - BigInt(buyAction.amount));
              simulatedOpportunities.push(opp);
            }
          }
        }
      }


      if (simulatedOpportunities.length === 0) {
        logger.info('[ArbitrageEngine] No profitable arbitrage opportunities found in this cycle after simulation.');
      } else {
        logger.info(`[ArbitrageEngine] Found ${simulatedOpportunities.length} profitable arbitrage opportunities!`);
        simulatedOpportunities.forEach(opp => {
          logger.info(`  - Profit: ${opp.profit}`);
          opp.tradeActions.forEach(action => {
            logger.info(`    - ${action.action} on ${action.exchange} at ${action.price}`);
          });
        });
      }

      logger.info('[ArbitrageEngine] Arbitrage cycle completed successfully.');
      return simulatedOpportunities;

    } catch (error: any) {
      logger.error('[ArbitrageEngine] An error occurred during the arbitrage cycle:', error);
      return [];
    }
  }
}
