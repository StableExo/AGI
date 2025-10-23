// src/constants/tokens.ts
import { Token } from '@uniswap/sdk-core';
import { PROTOCOL_ADDRESSES } from './addresses';

const { BASE_CHAIN_ID } = PROTOCOL_ADDRESSES;

// Helper function to add metadata consistently
function createTokenWithMetadata(address: string, decimals: number, symbol: string, name: string, metadata: { [key: string]: string }) {
    const token = new Token(BASE_CHAIN_ID, address, decimals, symbol, name);
    return Object.assign(token, metadata);
}

// Define Tokens for Base Network
export const BASE_TOKENS = {
    WETH: createTokenWithMetadata(
        '0x4200000000000000000000000000000000000006', 18, 'WETH', 'Wrapped Ether',
        { canonicalSymbol: 'WETH', type: 'native' }
    ),
    USDC: createTokenWithMetadata(
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 6, 'USDC', 'USD Coin',
        { canonicalSymbol: 'USDC', type: 'stablecoin' }
    ),
    // Add other Base tokens as they become relevant
};
