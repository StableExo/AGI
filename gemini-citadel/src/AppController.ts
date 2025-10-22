import 'dotenv/config';
import { Wallet, JsonRpcProvider } from 'ethers';
import { CexStrategyEngine } from './services/CexStrategyEngine';
import { ExchangeDataProvider } from './services/ExchangeDataProvider';
import { ExecutionManager } from './services/ExecutionManager';
import { FlashbotsService } from './services/FlashbotsService';
import { TelegramAlertingService } from './services/telegram-alerting.service';
import { MarketIntelligenceService } from './services/MarketIntelligenceService';
import { botConfig } from './config/bot.config';
import logger from './services/logger.service';
import { ArbitrageEngine } from './havoc-core/core/ArbitrageEngine';
import { Token } from '@uniswap/sdk-core';
import { ArbitrageOpportunity } from './models/ArbitrageOpportunity';
import { BASE_TOKENS } from './havoc-core/constants/tokens';

export class AppController {
  private readonly exchangeDataProvider: ExchangeDataProvider;
  private readonly executionManager: ExecutionManager;
  private readonly cexStrategyEngine: CexStrategyEngine; // For CEX
  private readonly flashbotsService: FlashbotsService;
  private readonly telegramAlertingService: TelegramAlertingService;
  private readonly marketIntelligenceService: MarketIntelligenceService;
  private readonly arbitrageEngine: ArbitrageEngine;
  private lastMarketReportTime = 0;

  constructor(
    dataProvider: ExchangeDataProvider,
    executionManager: ExecutionManager,
    flashbotsService: FlashbotsService,
    cexStrategyEngine: CexStrategyEngine,
    telegramAlertingService: TelegramAlertingService,
    marketIntelligenceService: MarketIntelligenceService,
    arbitrageEngine: ArbitrageEngine
  ) {
    this.exchangeDataProvider = dataProvider;
    this.executionManager = executionManager;
    this.flashbotsService = flashbotsService;
    this.cexStrategyEngine = cexStrategyEngine;
    this.telegramAlertingService = telegramAlertingService;
    this.marketIntelligenceService = marketIntelligenceService;
    this.arbitrageEngine = arbitrageEngine;
  }

  public async runDexCycle(): Promise<void> {
    try {
      const poolConfigs = [
        {
          address: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640', // WETH/USDC 0.05%
          pair: [BASE_TOKENS.WETH, BASE_TOKENS.USDC] as [Token, Token],
        },
        // Add other pools to scan here
      ];
      const opportunities: ArbitrageOpportunity[] = await this.arbitrageEngine.runCycle(poolConfigs);

      if (opportunities.length > 0) {
        logger.info(`[AppController] Found ${opportunities.length} DEX opportunities. Executing...`);
        for (const opp of opportunities) {
          this.telegramAlertingService.sendArbitrageOpportunity(opp);
          if (opp.profit > botConfig.significantTradeThreshold) {
            await this.sendMarketWeatherReport();
          }
          // Pass the opportunity to the ExecutionManager for on-chain execution
          await this.executionManager.executeTrade(opp);
        }
      } else {
        logger.info(`[AppController] No DEX opportunities found in this cycle.`);
      }
    } catch (error) {
      logger.error(`[AppController] An error occurred during the DEX analysis cycle:`, error);
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
