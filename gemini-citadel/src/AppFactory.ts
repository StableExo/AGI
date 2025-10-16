import { Wallet, JsonRpcProvider } from 'ethers';
import { AppController } from './AppController';
import { StrategyEngine } from './services/strategy.service';
import { ExchangeDataProvider } from './services/ExchangeDataProvider';
import { ExecutionManager } from './services/ExecutionManager';
import { FlashbotsService } from './services/FlashbotsService';
import { botConfig } from './config/bot.config';
import logger from './services/logger.service';

// Import protocol modules
import { BtccCustomFetcher } from './protocols/btcc/BtccCustomFetcher';
import { MockFetcher } from './protocols/mock/MockFetcher';
import { BtccExecutor } from './protocols/btcc/BtccExecutor';
import { MockExecutor } from './protocols/mock/MockExecutor';
import { CoinbaseFetcher } from './protocols/coinbase/CoinbaseFetcher';
import { CoinbaseExecutor } from './protocols/coinbase/CoinbaseExecutor';
import { IExchange } from './interfaces/IExchange';

export class AppFactory {
  public static async create(): Promise<AppController> {
    logger.info('[AppFactory] Initializing application...');
    this.validateEnvVars();

    // --- Core Infrastructure Initialization ---
    const provider = new JsonRpcProvider(process.env.RPC_URL!);
    const executionSigner = new Wallet(process.env.EXECUTION_PRIVATE_KEY!, provider);

    // --- Protocol and Service Initialization ---
    const exchanges: IExchange[] = [];

    for (const exchangeConfig of botConfig.exchanges) {
      if (exchangeConfig.enabled) {
        let fetcher;
        let executor;
        switch (exchangeConfig.name) {
          case 'btcc':
            fetcher = new BtccCustomFetcher();
            executor = new BtccExecutor();
            break;
          case 'coinbase':
            fetcher = new CoinbaseFetcher();
            executor = new CoinbaseExecutor();
            break;
          case 'mockExchange':
            fetcher = new MockFetcher();
            executor = new MockExecutor();
            break;
          default:
            logger.warn(`[AppFactory] Unknown exchange type: ${exchangeConfig.name}. Skipping.`);
            continue;
        }
        exchanges.push({
          name: exchangeConfig.name,
          fetcher,
          executor,
          fee: exchangeConfig.fetcher.fee,
        });
      }
    }

    const dataProvider = new ExchangeDataProvider(exchanges);
    const flashbotsService = new FlashbotsService(provider, executionSigner);
    await flashbotsService.initialize();

    const executionManager = new ExecutionManager(flashbotsService, executionSigner);
    const strategyEngine = new StrategyEngine(dataProvider);

    logger.info('[AppFactory] Initialization complete.');
    return new AppController(dataProvider, executionManager, strategyEngine, flashbotsService);
  }

  private static validateEnvVars(): void {
    if (!process.env.RPC_URL) throw new Error('RPC_URL must be set.');
    if (!process.env.EXECUTION_PRIVATE_KEY) throw new Error('EXECUTION_PRIVATE_KEY must be set.');
    if (!process.env.FLASHBOTS_AUTH_KEY) throw new Error('FLASHBOTS_AUTH_KEY must be set.');
    if (!process.env.FLASH_SWAP_CONTRACT_ADDRESS) throw new Error('FLASH_SWAP_CONTRACT_ADDRESS must be set.');
  }
}