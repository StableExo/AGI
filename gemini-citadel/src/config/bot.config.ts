import 'dotenv/config';

export interface ExchangeConfig {
  name: string;
  type: 'CEX' | 'DEX';
  enabled: boolean;
  fee: number;
  apiKey?: string;
  apiSecret?: string;
}

export interface BotConfig {
  loopIntervalMs: number;
  exchanges: ExchangeConfig[];
  btcc: {
    apiUrl: string;
  };
  treasury: {
    walletAddress: string;
    rpcUrl: string;
  };
}

export const botConfig: BotConfig = {
  loopIntervalMs: process.env.LOOP_INTERVAL_MS ? parseInt(process.env.LOOP_INTERVAL_MS, 10) : 10000,
  exchanges: [
    {
      name: 'btcc',
      type: 'CEX',
      enabled: true,
      fee: 0.001,
      apiKey: process.env.BTCC_API_KEY,
      apiSecret: process.env.BTCC_API_SECRET,
    },
    {
      name: 'coinbase',
      type: 'DEX', // Assuming Coinbase integration uses a DEX path
      enabled: false,
      fee: 0.005,
      apiKey: process.env.COINBASE_API_KEY,
      apiSecret: process.env.COINBASE_API_SECRET,
    },
    {
        name: 'mockExchange',
        type: 'DEX',
        enabled: true,
        fee: 0.001,
    }
  ],
  btcc: {
    apiUrl: process.env.BTCC_API_URL || 'https://spotapi.btcc.com',
  },
  treasury: {
    walletAddress: process.env.TREASURY_WALLET_ADDRESS || '0x9358D67164258370B0C07C37d3BF15A4c97b8Ab3',
    rpcUrl: process.env.ETH_MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID', // Placeholder
  }
};