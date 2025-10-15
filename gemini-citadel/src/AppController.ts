import 'dotenv/config';
import { Wallet, JsonRpcProvider } from 'ethers';
import { StrategyEngine } from './services/strategy.service';
import { ExchangeDataProvider } from './services/ExchangeDataProvider';
import { ExecutionManager } from './services/ExecutionManager';
import { FlashbotsService } from './services/FlashbotsService';

// Import protocol modules
import { BtccCustomFetcher } from './protocols/btcc/BtccCustomFetcher';
import { MockFetcher } from './protocols/mock/MockFetcher';
import { BtccExecutor } from './protocols/btcc/BtccExecutor';
import { MockExecutor } from './protocols/mock/MockExecutor';
import { CoinbaseFetcher } from './protocols/coinbase/CoinbaseFetcher';
import { CoinbaseExecutor } from './protocols/coinbase/CoinbaseExecutor';
import { UniswapFetcher } from './protocols/uniswap/UniswapFetcher';

const LOOP_INTERVAL_MS = 10000; // 10 seconds

export class AppController {
  private readonly exchangeDataProvider: ExchangeDataProvider;
  private readonly executionManager: ExecutionManager;
  private readonly strategyEngine: StrategyEngine;
  private readonly flashbotsService: FlashbotsService;

  private constructor(
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

  public static async create(): Promise<AppController> {
    console.log('[AppController] Initializing...');
    this.validateEnvVars();

    // --- Core Infrastructure Initialization ---
    const provider = new JsonRpcProvider(process.env.RPC_URL!);
    const executionSigner = new Wallet(process.env.EXECUTION_PRIVATE_KEY!, provider);

    // --- Protocol and Service Initialization ---
    const btccFetcher = new BtccCustomFetcher();
    const mockFetcher = new MockFetcher();
    const uniswapFetcher = new UniswapFetcher();
    const btccExecutor = new BtccExecutor();
    const mockExecutor = new MockExecutor();

    const dataProvider = new ExchangeDataProvider(
      [
        { name: 'btcc', instance: btccFetcher, fee: 0.001 },
        { name: 'mockExchange', instance: mockFetcher, fee: 0.001 },
        { name: 'uniswap', instance: uniswapFetcher, fee: 0.003 },
      ],
      [
        { name: 'btcc', instance: btccExecutor },
        { name: 'mockExchange', instance: mockExecutor },
      ]
    );

    const flashbotsService = new FlashbotsService(provider, executionSigner);
    await flashbotsService.initialize();

    const executionManager = new ExecutionManager(flashbotsService, executionSigner);
    const strategyEngine = new StrategyEngine(dataProvider);

    console.log('[AppController] Initialization complete.');
    return new AppController(dataProvider, executionManager, strategyEngine, flashbotsService);
  }

  private static validateEnvVars(): void {
    if (!process.env.RPC_URL) throw new Error('RPC_URL must be set.');
    if (!process.env.EXECUTION_PRIVATE_KEY) throw new Error('EXECUTION_PRIVATE_KEY must be set.');
    if (!process.env.FLASHBOTS_AUTH_KEY) throw new Error('FLASHBOTS_AUTH_KEY must be set.');
    if (!process.env.FLASH_SWAP_CONTRACT_ADDRESS) throw new Error('FLASH_SWAP_CONTRACT_ADDRESS must be set.');
  }

  public async runSingleCycle(): Promise<void> {
    try {
      console.log(`[AppController] [${new Date().toISOString()}] Starting analysis cycle...`);
      const opportunities = await this.strategyEngine.findOpportunities();

      if (opportunities.length > 0) {
        console.log(`[AppController] [${new Date().toISOString()}] Found ${opportunities.length} opportunities. Executing...`);
        await Promise.all(
          opportunities.map(opp =>
            this.executionManager.executeTrade(opp, process.env.FLASH_SWAP_CONTRACT_ADDRESS!)
          )
        );
      } else {
        console.log(`[AppController] [${new Date().toISOString()}] No opportunities found in this cycle.`);
      }

      console.log(`[AppController] [${new Date().toISOString()}] Analysis cycle completed successfully.`);
    } catch (error) {
      console.error(`[AppController] [${new Date().toISOString()}] An error occurred during the analysis cycle:`, error);
    }
  }

  public async start() {
    console.log('[AppController] Starting main execution loop...');
    // Perform an immediate run on startup, then enter the loop.
    await this.runSingleCycle();
    setInterval(() => this.runSingleCycle(), LOOP_INTERVAL_MS);
  }
}