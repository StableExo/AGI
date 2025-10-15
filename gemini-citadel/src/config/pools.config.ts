import { Token } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';

// Mainnet addresses
const WBTC_ADDRESS = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

// Token objects
export const WBTC = new Token(1, WBTC_ADDRESS, 8, 'WBTC', 'Wrapped Bitcoin');
export const WETH = new Token(1, WETH_ADDRESS, 18, 'WETH', 'Wrapped Ether');

interface PoolInfo {
    token0: Token;
    token1: Token;
    fee: FeeAmount;
    poolAddress: string;
}

// Pool configurations
export const POOLS: Record<string, PoolInfo> = {
    'WBTC/WETH': {
        token0: WBTC,
        token1: WETH,
        fee: FeeAmount.MEDIUM, // 3000 = 0.3%
        poolAddress: '0x4585fe77225b41b697c938b018e2ac67ac5a20c0', // WBTC/WETH 0.3%
    },
};