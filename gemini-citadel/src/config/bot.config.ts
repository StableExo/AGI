import 'dotenv/config';

export interface ExchangeConfig {
  name: string;
  enabled: boolean;
  fetcher: {
    fee: number;
  };
  executor: {
    apiKey: string | undefined;
    apiSecret: string | undefined;
  };
}

export interface BotConfig {
  loopIntervalMs: number;
  exchanges: ExchangeConfig[];
}

export const botConfig: BotConfig = {
  loopIntervalMs: process.env.LOOP_INTERVAL_MS ? parseInt(process.env.LOOP_INTERVAL_MS, 10) : 10000,
  exchanges: [
    {
      name: 'btcc',
      enabled: true,
      fetcher: {
        fee: 0.001,
      },
      executor: {
        apiKey: process.env.BTCC_API_KEY,
        apiSecret: process.env.BTCC_API_SECRET,
      },
    },
    {
      name: 'coinbase',
      enabled: false,
      fetcher: {
        fee: 0.005,
      },
      executor: {
        apiKey: process.env.COINBASE_API_KEY,
        apiSecret: process.env.COINBASE_API_SECRET,
      },
    },
    {
        name: 'mockExchange',
        enabled: true,
        fetcher: {
            fee: 0.001,
        },
        executor: {
            apiKey: undefined,
            apiSecret: undefined,
        },
    }
  ],
};