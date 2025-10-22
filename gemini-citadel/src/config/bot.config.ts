import 'dotenv/config';
import { CoinbaseConfig } from './coinbase.config';
import { dexConfig } from './dex.config';

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
}

export const botConfig: BotConfig = {
  loopIntervalMs: process.env.LOOP_INTERVAL_MS ? parseInt(process.env.LOOP_INTERVAL_MS, 10) : 10000,
  significantTradeThreshold: 100, // In USD
  exchanges: {
    btcc: {
      type: 'CEX',
      enabled: false, // Disabling until fully implemented
      fee: 0.001,
      apiKey: process.env.BTCC_API_KEY,
      apiSecret: process.env.BTCC_API_SECRET,
      apiUrl: process.env.BTCC_API_URL || 'https://spotapi.btcc.com',
    },
    coinbase: {
      type: 'CEX',
      enabled: true, // Enabled for reconnaissance
      fee: 0.005,
      apiKey: process.env.COINBASE_API_KEY,
      apiSecret: process.env.COINBASE_API_SECRET,
      details: CoinbaseConfig,
    },
    kraken: {
      type: 'CEX',
      enabled: true, // Enabled for reconnaissance
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
    walletAddress: process.env.TREASURY_WALLET_ADDRESS || '0x9358D67164258370B0C07C37d3BF15A4c97b8Ab3',
    rpcUrl: process.env.ETH_MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID', // Placeholder
  },
  dex: dexConfig,
};
