// gemini-citadel/src/havoc-core/constants/tokens.ts
import { Token } from '@uniswap/sdk-core';

const BASE_CHAIN_ID = 8453;

// Helper function to create token instances with metadata
function createToken(address: string, decimals: number, symbol: string, name: string): Token {
  return new Token(BASE_CHAIN_ID, address, decimals, symbol, name);
}

// Define Tokens for Base Network
export const BASE_TOKENS = {
  WETH: createToken('0x4200000000000000000000000000000000000006', 18, 'WETH', 'Wrapped Ether'),
  USDC: createToken('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 6, 'USDC', 'USD Coin'),
  // Add other Base network tokens as needed
};
