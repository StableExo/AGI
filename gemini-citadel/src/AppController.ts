import 'dotenv/config';
import { Wallet, JsonRpcProvider } from 'ethers';
import { StrategyEngine } from './services/strategy.service';
import { CexStrategyEngine } from './services/CexStrategyEngine';
import { DexStrategyEngine } from './services/DexStrategyEngine';
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
  private readonly dexStrategyEngine: DexStrategyEngine; // For CEX/DEX
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
    dexStrategyEngine: DexStrategyEngine,
    telegramAlertingService: TelegramAlertingService,
    marketIntelligenceService: MarketIntelligenceService
  ) {
    this.exchangeDataProvider = dataProvider;
    this.executionManager = executionManager;
    this.strategyEngine = strategyEngine;
    this.flashbotsService = flashbotsService;
    this.cexStrategyEngine = cexStrategyEngine;
    this.dexStrategyEngine = dexStrategyEngine;
    this.telegramAlertingService = telegramAlertingService;
    this.marketIntelligenceService = marketIntelligenceService;
  }

  public async runDexCycle(): Promise<void> {
    try {
      logger.info(`[AppController] Starting CEX/DEX analysis cycle...`);
      const pairsToSearch = [{ base: 'BTC', quote: 'USDT' }]; // Example pair
      const opportunities = await this.dexStrategyEngine.findOpportunities(pairsToSearch);

      if (opportunities.length > 0) {
        logger.info(`[AppController] Found ${opportunities.length} CEX/DEX opportunities. Executing...`);
        for (const opp of opportunities) {
          this.telegramAlertingService.sendArbitrageOpportunity(opp);
        }
        // CEX/DEX execution logic will be added here in the future
      } else {
        logger.info(`[AppController] No CEX/DEX opportunities found in this cycle.`);
      }

      logger.info(`[AppController] CEX/DEX analysis cycle completed successfully.`);
    } catch (error) {
      logger.error(`[AppController] An error occurred during the CEX/DEX analysis cycle:`, error);
    }
  }

  public async start() {
    logger.info('[AppController] Starting main execution loop...');
    // Perform an immediate run on startup, then enter the loop.
    await Promise.all([this.runCexCycle(), this.runDexCycle()]);
    setInterval(() => Promise.all([this.runCexCycle(), this.runDexCycle()]), botConfig.loopIntervalMs);
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