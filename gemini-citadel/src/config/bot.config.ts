import 'dotenv/config';
import { CoinbaseConfig } from './coinbase.config';
import { dexConfig } from './dex.config';
import { DEXRegistry } from '../dex/DEXRegistry';
import * as Validators from '../utils/configValidators';
import logger from '../services/logger.service';

// The generic part of an exchange's config
export interface BaseExchangeConfig {
  type: 'CEX' | 'DEX';
  enabled: boolean;
  fee: number;
}

// Specific config for CEXes that need API keys
export interface CexExchangeConfig extends BaseExchangeConfig {
  type: 'CEX';
  apiKey?: string;
  apiSecret?: string;
}

export interface BotConfig {
  loopIntervalMs: number;
  significantTradeThreshold: number;
  exchanges: {
    btcc: CexExchangeConfig & { apiUrl: string };
    coinbase: CexExchangeConfig & { details: typeof CoinbaseConfig };
    kraken: CexExchangeConfig;
    mockExchange: BaseExchangeConfig;
  };
  treasury: {
    walletAddress: string;
    rpcUrl: string;
  };
  dex: typeof dexConfig;
  dexRegistry: DEXRegistry;
}

const rpcUrls = Validators.validateRpcUrls(process.env.RPC_URL, 'RPC_URL');
if (!rpcUrls || rpcUrls.length === 0) {
    logger.error('CRITICAL: No valid RPC_URL found in environment variables. Exiting.');
    process.exit(1);
}

const treasuryWalletAddress = Validators.validateAndNormalizeAddress(process.env.TREASURY_WALLET_ADDRESS, 'TREASURY_WALLET_ADDRESS');
if (!treasuryWalletAddress) {
    logger.error('CRITICAL: No valid TREASURY_WALLET_ADDRESS found in environment variables. Exiting.');
    process.exit(1);
}

export const botConfig: BotConfig = {
  loopIntervalMs: Validators.safeParseInt(process.env.LOOP_INTERVAL_MS, 'LOOP_INTERVAL_MS', 10000),
  significantTradeThreshold: 100, // In USD
  exchanges: {
    btcc: {
      type: 'CEX',
      enabled: Validators.parseBoolean(process.env.BTCC_ENABLED),
      fee: 0.001,
      apiKey: process.env.BTCC_API_KEY,
      apiSecret: process.env.BTCC_API_SECRET,
      apiUrl: process.env.BTCC_API_URL || 'https://spotapi.btcc.com',
    },
    coinbase: {
      type: 'CEX',
      enabled: Validators.parseBoolean(process.env.COINBASE_ENABLED),
      fee: 0.005,
      apiKey: process.env.COINBASE_API_KEY,
      apiSecret: process.env.COINBASE_API_SECRET,
      details: CoinbaseConfig,
    },
    kraken: {
      type: 'CEX',
      enabled: Validators.parseBoolean(process.env.KRAKEN_ENABLED),
      fee: 0.0016, // Standard Kraken fee
      apiKey: process.env.KRAKEN_API_KEY,
      apiSecret: process.env.KRAKEN_API_SECRET,
    },
    mockExchange: {
        type: 'DEX',
        enabled: true,
        fee: 0.001,
    }
  },
  treasury: {
    walletAddress: treasuryWalletAddress,
    rpcUrl: rpcUrls[0],
  },
  dex: dexConfig,
  dexRegistry: new DEXRegistry(rpcUrls[0]),
};
