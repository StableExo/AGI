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

// New Imports for Nervous System
import KafkaService from './services/KafkaService';
import { KafkaHealthMonitor } from './services/KafkaHealthMonitor';
import { MarketDataProducer } from './services/MarketDataProducer';
import { BtccProducer } from './services/BtccProducer';


export class AppController {
  // Existing Services
  private readonly exchangeDataProvider: ExchangeDataProvider;
  private readonly executionManager: ExecutionManager;
  private readonly flashbotsService: FlashbotsService;
  private readonly telegramAlertingService: TelegramAlertingService;
  private readonly marketIntelligenceService: MarketIntelligenceService;
  private readonly arbitrageEngine: ArbitrageEngine;
  private lastMarketReportTime = 0;

  // New Nervous System Components
  private readonly cexStrategyEngine: CexStrategyEngine; // Now a consumer
  private readonly healthMonitor: KafkaHealthMonitor;
  private readonly marketDataProducers: Map<string, MarketDataProducer>;

  constructor(
    dataProvider: ExchangeDataProvider,
    executionManager: ExecutionManager,
    flashbotsService: FlashbotsService,
    cexStrategyEngine: CexStrategyEngine,
    telegramAlertingService: TelegramAlertingService,
    marketIntelligenceService: MarketIntelligenceService,
    arbitrageEngine: ArbitrageEngine,
    healthMonitor: KafkaHealthMonitor // Injected
  ) {
    this.exchangeDataProvider = dataProvider;
    this.executionManager = executionManager;
    this.flashbotsService = flashbotsService;
    this.telegramAlertingService = telegramAlertingService;
    this.marketIntelligenceService = marketIntelligenceService;
    this.arbitrageEngine = arbitrageEngine;

    // Nervous System Initialization
    this.cexStrategyEngine = cexStrategyEngine;
    this.healthMonitor = healthMonitor;
    this.marketDataProducers = new Map();
    this.initializeProducers();
  }

  /**
   * Initializes and registers all market data producers.
   * In a real system, this would be driven by the bot configuration.
   */
  private initializeProducers(): void {
    const btccProducer = new BtccProducer();
    this.marketDataProducers.set('btcc', btccProducer);
    // Future producers (Binance, Kraken, etc.) would be added here.
  }

  /**
   * Initializes and starts the Kafka-based event-driven nervous system.
   */
  public async initializeNervousSystem(): Promise<void> {
    logger.info('[AppController] Initializing nervous system...');

    // 1. Connect to the Kafka cluster
    await KafkaService.connect();

    // 2. Begin system health surveillance
    logger.info('[AppController] Starting health monitoring...');
    setInterval(() => this.healthMonitor.checkHealth(), 60000); // Check health every 60s

    // 3. Launch persistent producer services for each exchange
    logger.info('[AppController] Launching market data producers...');
    for (const [name, producer] of this.marketDataProducers.entries()) {
      producer.start().catch(err => logger.error(`[AppController] Producer ${name} failed to start:`, err));
    }

    // 4. Start strategy consumer pool
    logger.info('[AppController] Launching strategy consumers...');
    this.cexStrategyEngine.start().catch(err => logger.error(`[AppController] CEX Strategy Engine consumer failed to start:`, err));
  }

  public async start() {
    logger.info('[AppController] Starting Gemini Citadel...');

    // 1. Initialize the new event-driven nervous system for CEX arbitrage
    await this.initializeNervousSystem();

    // 2. The DEX cycle can remain as-is for now, running on its own interval
    logger.info('[AppController] Starting DEX execution loop...');
    await this.runDexCycle();
    setInterval(() => this.runDexCycle(), botConfig.loopIntervalMs);

    // Note: The synchronous runCexCycle() has been removed. CEX opportunity
    // detection is now handled by the event-driven CexStrategyEngine consumer.
  }

  // DEX cycle remains unchanged
  public async runDexCycle(): Promise<void> {
    try {
      const poolConfigs = [
        {
          address: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640', // WETH/USDC 0.05%
          pair: [BASE_TOKENS.WETH, BASE_TOKENS.USDC] as [Token, Token],
        },
      ];
      const opportunities: ArbitrageOpportunity[] = await this.arbitrageEngine.runCycle(poolConfigs);

      if (opportunities.length > 0) {
        logger.info(`[AppController] Found ${opportunities.length} DEX opportunities. Executing...`);
        for (const opp of opportunities) {
          this.telegramAlertingService.sendArbitrageOpportunity(opp);
          await this.executionManager.executeTrade(opp);
        }
      } else {
        logger.info(`[AppController] No DEX opportunities found in this cycle.`);
      }
    } catch (error) {
      logger.error(`[AppController] An error occurred during the DEX analysis cycle:`, error);
    }
  }

  // Weather report can be triggered by other events in the future
  private async sendMarketWeatherReport(): Promise<void> {
    const metrics = await this.marketIntelligenceService.getGlobalMarketMetrics();
    if (metrics) {
      this.telegramAlertingService.sendMarketWeather(metrics);
    }
  }
}
