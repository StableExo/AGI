import { DataService } from './services/data.service';
import { StrategyEngine } from './services/strategy.service';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
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
    const strategyEngine = new StrategyEngine(); // Instantiate the new engine

    await dataService.getBlockNumber();

    // Placeholder for future logic
    strategyEngine.findOpportunities([]);

    console.log('--- System Initialized Successfully ---');
  } catch (error) {
    console.error('An error occurred during system initialization:', error);
    process.exit(1);
  }
};

main();