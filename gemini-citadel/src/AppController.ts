import 'dotenv/config';
import { StrategyEngine } from './services/strategy.service';
import { ExchangeDataProvider } from './services/ExchangeDataProvider';
import { ExecutionManager } from './services/ExecutionManager';

// Import protocol modules
import { BtccFetcher } from './protocols/btcc/BtccFetcher';
import { BtccOrderBuilder } from './protocols/btcc/BtccOrderBuilder';

const LOOP_INTERVAL_MS = 10000; // 10 seconds

export class AppController {
  private readonly exchangeDataProvider: ExchangeDataProvider;
  private readonly executionManager: ExecutionManager;
  private readonly strategyEngine: StrategyEngine;

  constructor() {
    console.log('[AppController] Initializing...');

    // --- Protocol and Service Initialization ---

    // 1. Initialize BTCC Protocol Module
    const btccApiKey = process.env.BTCC_API_KEY;
    const btccApiSecret = process.env.BTCC_API_SECRET;
    if (!btccApiKey || !btccApiSecret) {
      throw new Error('BTCC_API_KEY or BTCC_API_SECRET is not set in the .env file.');
    }
    const btccFetcher = new BtccFetcher(btccApiKey, btccApiSecret);
    const btccOrderBuilder = new BtccOrderBuilder();

    // 2. Initialize Data Provider and Execution Manager
    this.exchangeDataProvider = new ExchangeDataProvider([
      { name: 'btcturk', instance: btccFetcher },
      // Future fetchers (e.g., for Uniswap) will be added here
    ]);

    this.executionManager = new ExecutionManager([
      { name: 'btcturk', instance: btccOrderBuilder },
      // Future builders will be added here
    ]);

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
        // The execution manager will handle the "Log-Only" logic.
        await Promise.all(opportunities.map(opp => this.executionManager.execute(opp)));
      } else {
        console.log(`[AppController] [${new Date().toISOString()}] No opportunities found in this cycle.`);
      }

      console.log(`[AppController] [${new Date().toISOString()}] Analysis cycle completed successfully.`);
    } catch (error) {
      console.error(`[AppController] [${new Date().toISOString()}] An error occurred during the analysis cycle:`, error);
    }
  }

  /**
   * Starts the main application loop, which runs cycles indefinitely.
   */
  public async start() {
    console.log('[AppController] Starting main execution loop...');
    // Perform an initial run immediately on startup
    await this.runSingleCycle();

    while (true) {
      console.log(`[AppController] Waiting for ${LOOP_INTERVAL_MS / 1000} seconds before the next cycle...`);
      await new Promise(resolve => setTimeout(resolve, LOOP_INTERVAL_MS));
      await this.runSingleCycle();
    }
  }
}