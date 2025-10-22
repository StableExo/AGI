import { Wallet, JsonRpcProvider } from 'ethers';
import { AppController } from './AppController';
import { ExchangeDataProvider } from './services/ExchangeDataProvider';
import { ExecutionManager } from './services/ExecutionManager';
import { FlashbotsService } from './services/FlashbotsService';
import { CexStrategyEngine } from './services/CexStrategyEngine';
import { FiatConversionService } from './services/FiatConversionService';
import { TelegramAlertingService } from './services/telegram-alerting.service';
import { MarketIntelligenceService } from './services/MarketIntelligenceService';
import { botConfig } from './config/bot.config';
import logger from './services/logger.service';

// Import CEX protocol modules
import { CcxtFetcher } from './protocols/CcxtFetcher';

// Import DEX protocol modules
import { UniswapV3Fetcher } from './havoc-core/core/fetchers/UniswapV3Fetcher';
import { ArbitrageEngine } from './havoc-core/core/ArbitrageEngine';

export class AppFactory {
  public static async create(): Promise<AppController> {
    logger.info('[AppFactory] Initializing application...');
    this.validateEnvVars();

    // --- Core Infrastructure Initialization ---
    const provider = new JsonRpcProvider(process.env.RPC_URL!);
    const executionSigner = new Wallet(process.env.EXECUTION_PRIVATE_KEY!, provider);

    // --- Service Initialization ---
    const dataProvider = new ExchangeDataProvider([]);
    const flashbotsService = new FlashbotsService(provider, executionSigner);
    await flashbotsService.initialize();
    const executionManager = new ExecutionManager(flashbotsService, executionSigner, dataProvider);
    const cexStrategyEngine = new CexStrategyEngine(dataProvider);
    const fiatConversionService = new FiatConversionService();
    const telegramAlertingService = new TelegramAlertingService(
      process.env.TELEGRAM_BOT_TOKEN!,
      process.env.TELEGRAM_CHAT_ID!,
      fiatConversionService
    );
    const marketIntelligenceService = new MarketIntelligenceService();

    // --- Havoc Core Initialization ---
    const uniswapV3Fetcher = new UniswapV3Fetcher(provider);
    const arbitrageEngine = new ArbitrageEngine(provider, uniswapV3Fetcher);

    // --- Protocol Initialization ---
    for (const exchangeConfig of botConfig.exchanges) {
      if (exchangeConfig.enabled && exchangeConfig.type === 'CEX') {
        const cexFetcher = new CcxtFetcher(
          exchange.name,
          exchange.apiKey,
          exchange.apiSecret
        );
        dataProvider.registerCexFetcher(exchange.name, cexFetcher, exchange.fee);
      }
    }

    logger.info('[AppFactory] Initialization complete.');
    return new AppController(
      dataProvider,
      executionManager,
      flashbotsService,
      cexStrategyEngine,
      telegramAlertingService,
      marketIntelligenceService,
      arbitrageEngine
    );
  }

  private static validateEnvVars(): void {
    if (!process.env.RPC_URL) throw new Error('RPC_URL must be set.');
    if (!process.env.EXECUTION_PRIVATE_KEY) throw new Error('EXECUTION_PRIVATE_KEY must be set.');
    if (!process.env.FLASHBOTS_AUTH_KEY) throw new Error('FLASHBOTS_AUTH_KEY must be set.');
    if (!process.env.FLASH_SWAP_CONTRACT_ADDRESS) throw new Error('FLASH_SWAP_CONTRACT_ADDRESS must be set.');
    if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN must be set.');
    if (!process.env.TELEGRAM_CHAT_ID) throw new Error('TELEGRAM_CHAT_ID must be set.');
  }
}
