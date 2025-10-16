import 'dotenv/config';
import { Wallet, JsonRpcProvider } from 'ethers';
import { StrategyEngine } from './services/strategy.service';
import { ExchangeDataProvider } from './services/ExchangeDataProvider';
import { ExecutionManager } from './services/ExecutionManager';
import { FlashbotsService } from './services/FlashbotsService';
import { botConfig } from './config/bot.config';
import logger from './services/logger.service';

export class AppController {
  private readonly exchangeDataProvider: ExchangeDataProvider;
  private readonly executionManager: ExecutionManager;
  private readonly strategyEngine: StrategyEngine;
  private readonly flashbotsService: FlashbotsService;

  constructor(
    dataProvider: ExchangeDataProvider,
    executionManager: ExecutionManager,
    strategyEngine: StrategyEngine,
    flashbotsService: FlashbotsService
  ) {
    this.exchangeDataProvider = dataProvider;
    this.executionManager = executionManager;
    this.strategyEngine = strategyEngine;
    this.flashbotsService = flashbotsService;
  }

  public async runSingleCycle(): Promise<void> {
    try {
      logger.info(`[AppController] Starting analysis cycle...`);
      const opportunities = await this.strategyEngine.findOpportunities();

      if (opportunities.length > 0) {
        logger.info(`[AppController] Found ${opportunities.length} opportunities. Executing...`);
        await Promise.all(
          opportunities.map(opp =>
            this.executionManager.executeTrade(opp, process.env.FLASH_SWAP_CONTRACT_ADDRESS!)
          )
        );
      } else {
        logger.info(`[AppController] No opportunities found in this cycle.`);
      }

      logger.info(`[AppController] Analysis cycle completed successfully.`);
    } catch (error) {
      logger.error(`[AppController] An error occurred during the analysis cycle:`, error);
    }
  }

  public async start() {
    logger.info('[AppController] Starting main execution loop...');
    // Perform an immediate run on startup, then enter the loop.
    await this.runSingleCycle();
    setInterval(() => this.runSingleCycle(), botConfig.loopIntervalMs);
  }
}