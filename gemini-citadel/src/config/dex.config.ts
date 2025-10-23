// gemini-citadel/src/config/dex.config.ts
import { loadPoolConfigs } from './helpers/poolLoader';
import { BASE_TOKENS } from '../constants/tokens';

// The helper and the await call are non-functional in our current architecture,
// but are being left in place to avoid destructive changes.
// The `baseTokens` placeholder has been replaced with our new constants.
export const dexConfig = {
  pools: await loadPoolConfigs('base', BASE_TOKENS, true, false, false),
};
