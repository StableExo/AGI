import 'dotenv/config';
import { Wallet, JsonRpcProvider } from 'ethers';
import { StrategyEngine } from './services/strategy.service';
import { CexStrategyEngine } from './services/CexStrategyEngine';
import { ExchangeDataProvider } from './services/ExchangeDataProvider';
import { ExecutionManager } from './services/ExecutionManager';
import { FlashbotsService } from './services/FlashbotsService';
import { TelegramAlertingService } from './services/telegram-alerting.service';
import { MarketIntelligenceService } from './services/MarketIntelligenceService';
import { botConfig } from './config/bot.config';
import logger from './services/logger.service';

export class AppController {
  private readonly exchangeDataProvider: ExchangeDataProvider;
  private readonly executionManager: ExecutionManager;
  private readonly strategyEngine: StrategyEngine; // For DEX
  private readonly cexStrategyEngine: CexStrategyEngine; // For CEX
  private readonly flashbotsService: FlashbotsService;
  private readonly telegramAlertingService: TelegramAlertingService;
  private readonly marketIntelligenceService: MarketIntelligenceService;
  private lastMarketReportTime = 0;

  constructor(
    dataProvider: ExchangeDataProvider,
    executionManager: ExecutionManager,
    strategyEngine: StrategyEngine,
    flashbotsService: FlashbotsService,
    cexStrategyEngine: CexStrategyEngine,
    telegramAlertingService: TelegramAlertingService,
    marketIntelligenceService: MarketIntelligenceService
  ) {
    this.exchangeDataProvider = dataProvider;
    this.executionManager = executionManager;
    this.strategyEngine = strategyEngine;
    this.flashbotsService = flashbotsService;
    this.cexStrategyEngine = cexStrategyEngine;
    this.telegramAlertingService = telegramAlertingService;
    this.marketIntelligenceService = marketIntelligenceService;
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

  public async start() {
    logger.info('[AppController] Starting main execution loop...');
    // Perform an immediate run on startup, then enter the loop.
    await this.runCexCycle(); // Prioritize CEX as per our new mission
    // await this.runDexCycle(); // We can disable the DEX cycle to focus on CEX
    setInterval(() => this.runCexCycle(), botConfig.loopIntervalMs);
  }

  private async sendMarketWeatherReport(): Promise<void> {
    const metrics = await this.marketIntelligenceService.getGlobalMarketMetrics();
    if (metrics) {
      this.telegramAlertingService.sendMarketWeather(metrics);
    }
  }

  public async runCexCycle(): Promise<void> {
    try {
      const now = Date.now();
      if (now - this.lastMarketReportTime > 24 * 60 * 60 * 1000) {
        await this.sendMarketWeatherReport();
        this.lastMarketReportTime = now;
      }
      logger.info(`[AppController] Starting CEX analysis cycle...`);
      // For now, we'll hardcode the pairs to search for. In the future, this would be dynamic.
      const pairsToSearch = [{ base: 'BTC', quote: 'USDT' }];
      const opportunities = await this.cexStrategyEngine.findOpportunities(pairsToSearch);

      if (opportunities.length > 0) {
        logger.info(`[AppController] Found ${opportunities.length} CEX opportunities. Executing...`);
        for (const opp of opportunities) {
          this.telegramAlertingService.sendArbitrageOpportunity(opp);
          if (opp.profit > botConfig.significantTradeThreshold) {
            await this.sendMarketWeatherReport();
          }
        }
        await Promise.all(
          opportunities.map(opp => this.executionManager.executeCexTrade(opp))
        );
      } else {
        logger.info(`[AppController] No CEX opportunities found in this cycle.`);
      }

      logger.info(`[AppController] CEX analysis cycle completed successfully.`);
    } catch (error) {
      logger.error(`[AppController] An error occurred during the CEX analysis cycle:`, error);
    }
  }
}