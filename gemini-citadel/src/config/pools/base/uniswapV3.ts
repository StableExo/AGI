// gemini-citadel/src/config/pools/base/uniswapV3.ts

export const UNISWAP_V3_POOLS = [
  {
    name: 'USDC/WETH',
    token0Symbol: 'USDC',
    token1Symbol: 'WETH',
    feeTierToEnvMap: {
      '500': 'UNI_V3_USDC_WETH_500_POOL_ADDRESS',
    }
  },
  {
    name: 'WETH/USDT',
    token0Symbol: 'WETH',
    token1Symbol: 'USDT',
    feeTierToEnvMap: {
      '3000': 'UNI_V3_WETH_USDT_3000_POOL_ADDRESS',
    }
  }
];
