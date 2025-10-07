// gemini-citadel/src/index.ts
import { DataService } from './services/data.service';
import { StrategyService } from './services/strategy.service';
import { Pool, Token } from './types'; // Import types
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

    // --- Test Harness for StrategyService ---
    const WETH: Token = { address: '0x...', symbol: 'WETH' };
    const USDC: Token = { address: '0x...', symbol: 'USDC' };

    // Create mock pool data with a clear price discrepancy
    const mockPools: Pool[] = [
      { address: 'pool1', tokenA: WETH, tokenB: USDC, price: 4000 }, // Buy here
      { address: 'pool2', tokenA: WETH, tokenB: USDC, price: 4050 }, // Sell here
      { address: 'pool3', tokenA: WETH, tokenB: { address: '0x...', symbol: 'DAI' }, price: 4010 }, // Different pair
    ];

    const opportunities = strategyService.findArbitrageOpportunities(mockPools);

    if (opportunities.length > 0) {
      console.log('--- Identified Arbitrage Opportunities ---');
      console.log(JSON.stringify(opportunities, null, 2));
    }
    // --- End Test Harness ---

    console.log('--- System Initialized Successfully ---');
  } catch (error) {
    console.error('An error occurred during system initialization:', error);
    process.exit(1);
  }
};

main();