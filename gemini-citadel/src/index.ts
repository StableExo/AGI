// gemini-citadel/src/index.ts
import { DataService } from './services/data.service';
import { StrategyService } from './services/strategy.service';
import { Pool, Opportunity } from './types'; // Import types
import * as dotenv from 'dotenv';

dotenv.config();

// --- Configuration ---
const config = {
  poolAddresses: [
    '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640', // WETH/USDC 0.05%
    '0x60594a405d53811d3bc4766596efd80fd545a270', // WETH/DAI 0.3%
  ],
  runInterval: 15000, // milliseconds
};

// --- Service Initialization ---
const rpcUrl = process.env.RPC_URL;
if (!rpcUrl) {
  console.error('FATAL: RPC_URL is not defined in the environment variables.');
  process.exit(1);
}

const dataService = new DataService(rpcUrl);
const strategyService = new StrategyService(dataService);

/**
 * The main operational cycle of the bot.
 * Fetches market data, analyzes for opportunities, and logs the results.
 */
const run = async () => {
  console.log('\n--- [INFO] Starting new analysis cycle ---');

  try {
    // --- Live Data Integration ---
    console.log('[INFO] Fetching live pool data...');
    const livePools: Pool[] = await Promise.all(
      config.poolAddresses.map((address) => dataService.getPoolData(address))
    );

    livePools.forEach((pool) => {
      console.log(
        `[INFO] Pool ${pool.tokenA.symbol}/${pool.tokenB.symbol} Price: ${pool.price}`
      );
    });

    // --- Analysis ---
    console.log('[INFO] Analyzing for arbitrage opportunities...');
    const opportunities: Opportunity[] =
      strategyService.findArbitrageOpportunities(livePools);

    if (opportunities.length > 0) {
      console.log('--- [OPPORTUNITY] Identified Arbitrage Opportunities ---');
      opportunities.forEach((opportunity) => {
        const buyPoolName = `${opportunity.buyPool.tokenA.symbol}/${opportunity.buyPool.tokenB.symbol}`;
        const sellPoolName = `${opportunity.sellPool.tokenA.symbol}/${opportunity.sellPool.tokenB.symbol}`;
        // Note: The 'profit' is based on the calculated profitMargin from the strategy.
        // The exact unit (e.g., USD, ETH) depends on the base asset used in calculations.
        console.log(
          `[OPPORTUNITY] Buy on ${buyPoolName}, Sell on ${sellPoolName}. Profit: ${opportunity.profitMargin}`
        );
      });
    } else {
      console.log('[INFO] No opportunities found in this cycle.');
    }
  } catch (error) {
    console.error(
      '[ERROR] An error occurred during the analysis cycle:',
      error
    );
  }
};

/**
 * The main entry point of the application.
 * Initializes the bot and starts the continuous operation loop.
 */
const main = async () => {
  console.log('--- Starting Gemini Citadel Off-Chain Brain ---');

  // Perform an immediate, initial run upon starting
  console.log('[INFO] Performing initial run...');
  await run();

  // Start the continuous loop
  console.log(
    `[INFO] Starting continuous loop every ${
      config.runInterval / 1000
    } seconds...`
  );
  setInterval(run, config.runInterval);
};

main();