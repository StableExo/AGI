import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';
import { DataService } from './services/data.service';
import { StrategyEngine } from './services/strategy.service';

// The structure of the configuration object expected by the StrategyEngine constructor.
interface StrategyPoolConfig {
  name: string;
  address: string;
  tokenA: string;
  tokenB: string;
  fee: number;
}

// The structure of the pool groups as defined in pools.config.json
interface PoolConfigGroup {
  name: string;
  pools: string[];
}

const LOOP_INTERVAL_MS = 10000; // 10 seconds

export class AppController {
  private readonly dataService: DataService;
  private readonly strategyEngine: StrategyEngine;

  constructor() {
    console.log('[AppController] Initializing...');

    const poolsConfigPath = path.join(__dirname, '..', 'pools.config.json');
    const poolsConfigFile = fs.readFileSync(poolsConfigPath, 'utf8');
    const poolConfigGroups: PoolConfigGroup[] = JSON.parse(poolsConfigFile);

    const strategyPoolsConfig: StrategyPoolConfig[] = poolConfigGroups.flatMap(group =>
      group.pools.map(poolAddress => ({
        name: group.name,
        address: poolAddress,
        tokenA: '',
        tokenB: '',
        fee: 0,
      }))
    );

    const rpcUrl = process.env.RPC_URL;
    if (!rpcUrl) {
      throw new Error('RPC_URL environment variable is not set.');
    }
    this.dataService = new DataService(rpcUrl);
    this.strategyEngine = new StrategyEngine(this.dataService, strategyPoolsConfig);

    console.log('[AppController] Initialization complete.');
  }

  /**
   * Runs a single analysis cycle. It finds opportunities and handles any errors.
   * This method is public to allow for granular testing.
   */
  public async runSingleCycle(): Promise<void> {
    try {
      console.log(`[AppController] [${new Date().toISOString()}] Starting analysis cycle...`);
      const opportunities = await this.strategyEngine.findOpportunities();
      if (opportunities.length > 0) {
          console.log(`[AppController] [${new Date().toISOString()}] Found ${opportunities.length} opportunities.`);
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
    while (true) {
      await this.runSingleCycle();
      console.log(`[AppController] Waiting for ${LOOP_INTERVAL_MS / 1000} seconds before the next cycle...`);
      await new Promise(resolve => setTimeout(resolve, LOOP_INTERVAL_MS));
    }
  }
}