// gemini-citadel/src/config/dex.config.ts
import { loadPoolConfigs } from './helpers/poolLoader';
import { botConfig } from './bot.config';

// Define a placeholder for baseTokens. In a real scenario, this would be dynamically loaded.
const baseTokens = {
  'USDC': { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
  'WETH': { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
  'USDT': { address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', decimals: 6 },
};

export const dexConfig = {
  pools: await loadPoolConfigs('base', baseTokens, true, false, false),
};
