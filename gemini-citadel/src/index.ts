// gemini-citadel/src/index.ts
import { DataService } from './services/data.service';
import { StrategyService } from './services/strategy.service';
import { Pool } from './types'; // Import types
import * as dotenv from 'dotenv';

dotenv.config();

const main = async () => {
  console.log('--- Starting Gemini Citadel Off-Chain Brain ---');
  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) {
    console.error('FATAL: RPC_URL is not defined in the environment variables.');
    process.exit(1);
  }

  try {
    const dataService = new DataService(rpcUrl);
    const strategyService = new StrategyService(dataService);

    // --- Live Data Integration ---
    console.log('--- Fetching Live Pool Data ---');

    // Pool addresses provided by Mnemosyne
    const poolAddresses = [
      '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640', // WETH/USDC 0.05%
      '0x60594a405d53811d3bc4766596efd80fd545a270', // WETH/DAI 0.3%
    ];

    // Fetch data for all pools in parallel
    const livePools: Pool[] = await Promise.all(
      poolAddresses.map((address) => dataService.getPoolData(address))
    );

    console.log('--- Analyzing for Arbitrage Opportunities ---');
    const opportunities = strategyService.findArbitrageOpportunities(livePools);

    if (opportunities.length > 0) {
      console.log('--- Identified Arbitrage Opportunities ---');
      console.log(JSON.stringify(opportunities, null, 2));
    } else {
      console.log('--- No Arbitrage Opportunities Found ---');
    }
    // --- End Live Data Integration ---

    console.log('--- System Initialized Successfully ---');
  } catch (error) {
    console.error('An error occurred during system initialization:', error);
    process.exit(1);
  }
};

main();