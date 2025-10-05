import { DataService } from './services/data.service';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '.env' });

const main = async () => {
  console.log('--- Starting Gemini Citadel Off-Chain Brain ---');

  const rpcUrl = process.env.RPC_URL;

  if (!rpcUrl) {
    console.error('FATAL: RPC_URL is not defined in the environment variables. Please check your .env file.');
    process.exit(1);
  }

  try {
    const dataService = new DataService(rpcUrl);

    // Test the connection by fetching the latest block number
    await dataService.getBlockNumber();

    console.log('--- System Initialized Successfully ---');
  } catch (error) {
    console.error('An error occurred during system initialization:', error);
    process.exit(1);
  }
};

main();
