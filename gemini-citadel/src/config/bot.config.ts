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
  }
};