import 'dotenv/config';
import { Wallet, JsonRpcProvider } from 'ethers';
import { StrategyEngine } from './services/strategy.service';
import { CexStrategyEngine } from './services/CexStrategyEngine';
import { ExchangeDataProvider } from './services/ExchangeDataProvider';
import { ExecutionManager } from './services/ExecutionManager';
import { FlashbotsService } from './services/FlashbotsService';
import { TelegramAlertingService } from './services/telegram-alerting.service';
import { botConfig } from './config/bot.config';
import logger from './services/logger.service';

export class AppController {
  private readonly exchangeDataProvider: ExchangeDataProvider;
  private readonly executionManager: ExecutionManager;
  private readonly strategyEngine: StrategyEngine; // For DEX
  private readonly cexStrategyEngine: CexStrategyEngine; // For CEX
  private readonly flashbotsService: FlashbotsService;
  private readonly telegramAlertingService: TelegramAlertingService;

  constructor(
    dataProvider: ExchangeDataProvider,
    executionManager: ExecutionManager,
    strategyEngine: StrategyEngine,
    flashbotsService: FlashbotsService,
    cexStrategyEngine: CexStrategyEngine,
    telegramAlertingService: TelegramAlertingService
  ) {
    this.exchangeDataProvider = dataProvider;
    this.executionManager = executionManager;
    this.strategyEngine = strategyEngine;
    this.flashbotsService = flashbotsService;
    this.cexStrategyEngine = cexStrategyEngine;
    this.telegramAlertingService = telegramAlertingService;
  }

  public async runDexCycle(): Promise<void> {
    try {
      logger.info(`[AppController] Starting DEX analysis cycle...`);
      const opportunities = await this.strategyEngine.findOpportunities();

      if (opportunities.length > 0) {
        logger.info(`[AppController] Found ${opportunities.length} DEX opportunities. Executing...`);
        await Promise.all(
          opportunities.map(opp =>
            this.executionManager.executeTrade(opp, process.env.FLASH_SWAP_CONTRACT_ADDRESS!)
          )
        );
      } else {
        logger.info(`[AppController] No DEX opportunities found in this cycle.`);
      }

      logger.info(`[AppController] DEX analysis cycle completed successfully.`);
    } catch (error) {
      logger.error(`[AppController] An error occurred during the DEX analysis cycle:`, error);
    }
  }

  public async runCexCycle(): Promise<void> {
    try {
      logger.info(`[AppController] Starting CEX analysis cycle...`);
      // For now, we'll hardcode the pairs to search for. In the future, this would be dynamic.
      const pairsToSearch = [{ base: 'BTC', quote: 'USDT' }];
      const opportunities = await this.cexStrategyEngine.findOpportunities(pairsToSearch);

      if (opportunities.length > 0) {
        logger.info(`[AppController] Found ${opportunities.length} CEX opportunities. Executing...`);
        // CEX execution logic will be added here in a future step.
        // For now, we just log the opportunities found.
        opportunities.forEach(opp => {
          logger.info(`[AppController]   Opportunity: Buy ${opp.pair.base} on ${opp.buyOn} at ${opp.buyPrice}, Sell on ${opp.sellOn} at ${opp.sellPrice}. Profit: ${opp.potentialProfit.toFixed(4)} ${opp.pair.quote}`);
        });
      } else {
        logger.info(`[AppController] No CEX opportunities found in this cycle.`);
      }

      logger.info(`[AppController] CEX analysis cycle completed successfully.`);
    } catch (error) {
      logger.error(`[AppController] An error occurred during the CEX analysis cycle:`, error);
    }
  }

  public async start() {
    logger.info('[AppController] Starting main execution loop...');
    // Perform an immediate run on startup, then enter the loop.
    await this.runCexCycle(); // Prioritize CEX as per our new mission
    // await this.runDexCycle(); // We can disable the DEX cycle to focus on CEX
    setInterval(() => this.runCexCycle(), botConfig.loopIntervalMs);
  }
}