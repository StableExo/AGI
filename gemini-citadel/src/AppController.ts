import 'dotenv/config';
import { StrategyEngine } from './services/strategy.service';
import { ExchangeDataProvider } from './services/ExchangeDataProvider';
import { ExecutionManager } from './services/ExecutionManager';

// Import protocol modules
import { BtccCustomFetcher } from './protocols/btcc/BtccCustomFetcher';
import { MockFetcher } from './protocols/mock/MockFetcher';
import { BtccExecutor } from './protocols/btcc/BtccExecutor';
import { MockExecutor } from './protocols/mock/MockExecutor';

const LOOP_INTERVAL_MS = 10000; // 10 seconds

export class AppController {
  private readonly exchangeDataProvider: ExchangeDataProvider;
  private readonly executionManager: ExecutionManager;
  private readonly strategyEngine: StrategyEngine;

  constructor() {
    console.log('[AppController] Initializing...');

    // --- Protocol and Service Initialization ---

    // 1. Initialize Protocol Modules
    const btccFetcher = new BtccCustomFetcher();
    const mockFetcher = new MockFetcher();
    const btccExecutor = new BtccExecutor();
    const mockExecutor = new MockExecutor();

    // 2. Initialize Data Provider
    this.exchangeDataProvider = new ExchangeDataProvider(
      [
        { name: 'btcc', instance: btccFetcher, fee: 0.001 },
        { name: 'mockExchange', instance: mockFetcher, fee: 0.001 }
      ],
      [
        { name: 'btcc', instance: btccExecutor },
        { name: 'mockExchange', instance: mockExecutor }
      ]
    );

    // 3. Initialize Execution Manager
    this.executionManager = new ExecutionManager(this.exchangeDataProvider);

    // 3. Initialize Strategy Engine
    // The old pool config loading is removed for now, as the strategy engine
    // will be simplified to use the new data provider.
    this.strategyEngine = new StrategyEngine(this.exchangeDataProvider);

    console.log('[AppController] Initialization complete.');
  }

  /**
   * Runs a single analysis and execution cycle.
   * This method is public to allow for granular testing.
   */
  public async runSingleCycle(): Promise<void> {
    try {
      console.log(`[AppController] [${new Date().toISOString()}] Starting analysis cycle...`);
      const opportunities = await this.strategyEngine.findOpportunities();

      if (opportunities.length > 0) {
        console.log(`[AppController] [${new Date().toISOString()}] Found ${opportunities.length} opportunities. Executing...`);
        // The new execution manager will handle the trade execution.
        await Promise.all(opportunities.map(opp => this.executionManager.executeTrade(opp)));
      } else {
        console.log(`[AppController] [${new Date().toISOString()}] No opportunities found in this cycle.`);
      }

      console.log(`[AppController] [${new Date().toISOString()}] Analysis cycle completed successfully.`);
    } catch (error) {
      console.error(`[AppController] [${new Date().toISOString()}] An error occurred during the analysis cycle:`, error);
    }
  }

  public async start() {
    // The main loop is temporarily disabled to allow for a clean,
    // single-run test of the connection. To re-enable, uncomment the
    // while(true) loop and the delay.
    console.log('[AppController] Starting main execution loop...');
    // while (true) {
      await this.runSingleCycle();
    //   await new Promise(resolve => setTimeout(resolve, LOOP_INTERVAL_MS));
    // }
  }
}