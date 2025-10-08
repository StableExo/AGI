import { DataService } from './services/data.service';
import * as dotenv from 'dotenv';
import { Pool } from './interfaces/Pool';

// Load environment variables from .env file
dotenv.config();

// A well-known, high-liquidity pool: WETH/USDC 0.05% on Ethereum Mainnet
const WETH_USDC_POOL_ADDRESS = '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640';

const validatePoolData = (poolData: Pool): boolean => {
  if (!poolData) return false;
  const hasAllKeys = poolData.address && poolData.token0.symbol && poolData.token1.symbol && poolData.fee;
  if (!hasAllKeys) {
      console.error('[Validation] Failed: Pool data is missing key properties.');
      return false;
  }
  if (poolData.address.toLowerCase() !== WETH_USDC_POOL_ADDRESS.toLowerCase()) {
      console.error('[Validation] Failed: Pool address mismatch.');
      return false;
  }
  console.log('[Validation] Success: Pool data structure appears valid.');
  return true;
};

const main = async () => {
  console.log('--- Starting Gemini Citadel Off-Chain Brain ---');

  const rpcUrl = process.env.RPC_URL;

  if (!rpcUrl) {
    console.error('FATAL: RPC_URL is not defined in the environment variables.');
    process.exit(1);
  }

  try {
    const dataService = new DataService(rpcUrl);

    console.log(`Fetching live data for pool: ${WETH_USDC_POOL_ADDRESS}...`);
    const poolData = await dataService.getV3PoolData(WETH_USDC_POOL_ADDRESS);

    console.log('--- Live Pool Data Received ---');
    console.log(JSON.stringify(poolData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2));
    console.log('-----------------------------');

    if (validatePoolData(poolData)) {
        console.log('--- System Initialized Successfully ---');
    } else {
        throw new Error('Live pool data failed validation.');
    }

  } catch (error) {
    console.error('An error occurred during system initialization:', error);
    process.exit(1);
  }
};

main();