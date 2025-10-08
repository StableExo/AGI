import { DataService } from './services/data.service';
import { StrategyEngine } from './services/strategy.service';
import * as dotenv from 'dotenv';
import { Pool } from './interfaces/Pool';

dotenv.config();

// Configuration
const POOL_ADDRESSES = [
  '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640', // WETH/USDC 0.05%
  '0x7bea39867e4169dbe237d55c8242a8f2fcdcc387', // WBTC/WETH 0.05%
  '0x11b815efb8f581194ae79006d24e0d814b7697f6'  // DAI/USDC 0.01%
];
const INTERVAL_MS = 15000; // 15 seconds

/**
 * The main execution cycle of the bot.
 */
const executeCycle = async (dataService: DataService, strategyEngine: StrategyEngine) => {
  try {
    console.log(`\n--- [${new Date().toISOString()}] Starting new execution cycle ---`);
    console.log(`Fetching market snapshot for ${POOL_ADDRESSES.length} pools...`);

    const poolPromises = POOL_ADDRESSES.map(addr => dataService.getV3PoolData(addr));
    const marketSnapshot: Pool[] = await Promise.all(poolPromises);

    console.log(`Successfully fetched data for ${marketSnapshot.length} pools.`);

    const opportunities = strategyEngine.findOpportunities(marketSnapshot);

    if (opportunities.length > 0) {
        console.log(`!!! Found ${opportunities.length} opportunities!`);
    } else {
        console.log('No opportunities found in this snapshot.');
    }

  } catch (error) {
    console.error('An error occurred during the execution cycle:', error);
  } finally {
    console.log('--- System Cycle Complete ---');
  }
};

const main = async () => {
  console.log('--- Initializing Gemini Citadel Off-Chain Brain ---');
  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) {
    console.error('FATAL: RPC_URL is not defined.');
    process.exit(1);
  }

  const dataService = new DataService(rpcUrl);
  const strategyEngine = new StrategyEngine();

  console.log('Initialization complete. Starting main execution loop...');
  // Perform an immediate initial run
  await executeCycle(dataService, strategyEngine);
  // Then, start the interval-based execution
  setInterval(() => executeCycle(dataService, strategyEngine), INTERVAL_MS);
};

main();