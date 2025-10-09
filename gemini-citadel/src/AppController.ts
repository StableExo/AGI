import { DataService } from './services/data.service';
import { StrategyEngine } from './services/strategy.service';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Define a simple delay function
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
const LOOP_INTERVAL_MS = 5000; // 5 seconds

export class AppController {
  private dataService: DataService;
  private strategyEngine: StrategyEngine;

  constructor() {
    const rpcUrl = process.env.RPC_URL;
    if (!rpcUrl) {
      throw new Error('FATAL: RPC_URL is not defined.');
    }

    // Correctly resolve the path to the configuration file from the project root
    const poolsConfigPath = path.join(__dirname, '../../pools.config.json');
    const pools = JSON.parse(fs.readFileSync(poolsConfigPath, 'utf-8'));

    this.dataService = new DataService(rpcUrl);
    this.strategyEngine = new StrategyEngine(this.dataService, pools);
  }

  public async start(): Promise<void> {
    console.log('[AppController] Starting continuous operation loop...');
    while (true) {
      try {
        console.log(`[AppController] Starting new analysis cycle.`);
        await this.strategyEngine.findOpportunities();
        console.log(`[AppController] Analysis cycle complete. Waiting for ${LOOP_INTERVAL_MS / 1000}s.`);
      } catch (error) {
        console.error('[AppController] An error occurred during the analysis cycle. The loop will continue.', error);
      }
      await delay(LOOP_INTERVAL_MS);
    }
  }
}