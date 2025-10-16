import { Wallet, JsonRpcProvider } from 'ethers';
import { AppController } from './AppController';
import { StrategyEngine } from './services/strategy.service';
import { ExchangeDataProvider } from './services/ExchangeDataProvider';
import { ExecutionManager } from './services/ExecutionManager';
import { FlashbotsService } from './services/FlashbotsService';
import { CexStrategyEngine } from './services/CexStrategyEngine';
import { botConfig } from './config/bot.config';
import logger from './services/logger.service';

// Import CEX protocol modules
import { BtccFetcher } from '../protocols/BtccFetcher';
import { BtccExecutor } from '../protocols/BtccExecutor';

// Import DEX protocol modules
import { MockFetcher } from './protocols/mock/MockFetcher';
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

    // --- Service Initialization ---
    const dataProvider = new ExchangeDataProvider([]); // Start with an empty provider
    const flashbotsService = new FlashbotsService(provider, executionSigner);
    await flashbotsService.initialize();
    const executionManager = new ExecutionManager(flashbotsService, executionSigner);
    const strategyEngine = new StrategyEngine(dataProvider); // For DEX
    const cexStrategyEngine = new CexStrategyEngine(dataProvider); // For CEX

    // --- Protocol Initialization ---
    for (const exchangeConfig of botConfig.exchanges) {
      if (exchangeConfig.enabled) {
        switch (exchangeConfig.type) {
          case 'CEX':
            if (exchangeConfig.name === 'btcc') {
              const cexFetcher = new BtccFetcher();
              // const cexExecutor = new BtccExecutor(); // Executor integration will be handled later
              dataProvider.registerCexFetcher(exchangeConfig.name, cexFetcher, exchangeConfig.fee);
            } else {
               logger.warn(`[AppFactory] Unknown CEX exchange: ${exchangeConfig.name}. Skipping.`);
            }
            break;
          case 'DEX':
             // Current DEX logic can remain here if needed
            break;
          default:
            logger.warn(`[AppFactory] Unknown exchange type: ${exchangeConfig.type}. Skipping.`);
            continue;
        }
      }
    }

    logger.info('[AppFactory] Initialization complete.');
    return new AppController(dataProvider, executionManager, strategyEngine, flashbotsService, cexStrategyEngine);
  }

  private static validateEnvVars(): void {
    if (!process.env.RPC_URL) throw new Error('RPC_URL must be set.');
    if (!process.env.EXECUTION_PRIVATE_KEY) throw new Error('EXECUTION_PRIVATE_KEY must be set.');
    // Flashbots may not be required for CEX-only operation, but we leave it for now.
    if (!process.env.FLASHBOTS_AUTH_KEY) throw new Error('FLASHBOTS_AUTH_KEY must be set.');
    if (!process.env.FLASH_SWAP_CONTRACT_address) throw new Error('FLASH_SWAP_CONTRACT_ADDRESS must be set.');
  }
}