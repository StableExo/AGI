import { DataService } from './services/data.service';
import { StrategyEngine } from './services/strategy.service';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const main = async () => {
  console.log('--- Starting Gemini Citadel Off-Chain Brain ---');

  const rpcUrl = process.env.RPC_URL;

  if (!rpcUrl) {
    console.error('FATAL: RPC_URL is not defined. Please check your .env file.');
    process.exit(1);
  }

  try {
    const dataService = new DataService(rpcUrl);
    const strategyEngine = new StrategyEngine(dataService);

    // This will become the main application loop
    await strategyEngine.findOpportunities();

    console.log('--- Main Loop Cycle Complete ---');
  } catch (error) {
    console.error('An error occurred during the main loop cycle:', error);
    process.exit(1);
  }
};

main();