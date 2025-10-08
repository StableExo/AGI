import { StrategyEngine } from './strategy.service';
import { Pool } from '../interfaces/Pool';

// Mock data using valid checksummed addresses and bigints
const MOCK_POOL_A: Pool = {
  address: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
  dex: 'UniswapV3',
  token0: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
  token1: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 },
  fee: 500,
  sqrtPriceX96: 2797883446869701119597357499268n, // Price ~1650
  liquidity: 1000000n,
  tick: 0,
};

const MOCK_POOL_B: Pool = {
  ...MOCK_POOL_A,
  address: '0x8ad599c3A0b1A56214534e7850e24B4C640d00A6',
  sqrtPriceX96: 2825862281338301119597357499268n, // Price ~1680 (higher)
};

const MOCK_POOL_C: Pool = {
    ...MOCK_POOL_A,
    address: '0x1c3c3a4d7c5a8a1a3e4e9e8c9c8a4c3a2a1a3e4e',
    sqrtPriceX96: 2797883446869701119597357499268n, // Same price as A
};


describe('StrategyEngine', () => {
  let engine: StrategyEngine;

  beforeEach(() => {
    engine = new StrategyEngine();
  });

  it('should find an opportunity when prices differ significantly', () => {
    const opportunities = engine.findOpportunities([MOCK_POOL_A, MOCK_POOL_B]);
    expect(opportunities).toHaveLength(1);
    expect(opportunities[0].type).toBe('arbitrage');
  });

  it('should not find an opportunity when prices are the same', () => {
    const opportunities = engine.findOpportunities([MOCK_POOL_A, MOCK_POOL_C]);
    expect(opportunities).toHaveLength(0);
  });

  it('should return the path with low price first, high price second', () => {
    const opportunities = engine.findOpportunities([MOCK_POOL_B, MOCK_POOL_A]); // Inverted order
    expect(opportunities).toHaveLength(1);
    const { path } = opportunities[0];
    expect(path[0].address).toBe(MOCK_POOL_A.address); // low price pool
    expect(path[1].address).toBe(MOCK_POOL_B.address); // high price pool
  });
});