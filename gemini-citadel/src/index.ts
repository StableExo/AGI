import { DataService } from './services/data.service';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const main = async () => {
  console.log('--- Starting Gemini Citadel Off-Chain Brain ---');

  // Use the new, structured environment variable
  const rpcUrl = process.env.ARBITRUM_RPC_URL;

  if (!rpcUrl) {
    console.error('FATAL: ARBITRUM_RPC_URL is not defined in the environment variables.');
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