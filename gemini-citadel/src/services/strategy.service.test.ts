import { StrategyEngine, Opportunity } from './strategy.service';
import { Pool } from '../interfaces/Pool';

// Use valid, checksummed addresses for mock data
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
const WBTC_ADDRESS = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';


// Mock Pool Data with valid addresses
const MOCK_POOL_A: Pool = {
  address: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640', // Real USDC-WETH pool
  dex: 'UniswapV3',
  token0: { address: USDC_ADDRESS, symbol: 'USDC', decimals: 6 },
  token1: { address: WETH_ADDRESS, symbol: 'WETH', decimals: 18 },
  fee: 500,
  sqrtPriceX96: 2273575399431482334314278996n, // Represents a price around ~3000
  liquidity: 1000000n,
  tick: 200000,
};

const MOCK_POOL_B: Pool = {
  ...MOCK_POOL_A,
  address: '0x8ad599c3A0b1452422a05e4a43b010C85265e681', // Different USDC-WETH pool
  // This sqrtPriceX96 represents a price of ~3300, a ~10% difference from Pool A.
  sqrtPriceX96: 2382707019404143549360374390n,
};

const MOCK_POOL_C: Pool = { // Different token pair (DAI-WBTC)
  address: '0x9993E2540514897291B646549463a6e24482517D',
  dex: 'UniswapV3',
  token0: { address: DAI_ADDRESS, symbol: 'DAI', decimals: 18 },
  token1: { address: WBTC_ADDRESS, symbol: 'WBTC', decimals: 8 },
  fee: 3000,
  sqrtPriceX96: 1n,
  liquidity: 1n,
  tick: 1,
};

describe('StrategyEngine', () => {
  let engine: StrategyEngine;

  beforeEach(() => {
    engine = new StrategyEngine();
  });

  it('should find an arbitrage opportunity between two pools with the same pair and different prices', () => {
    const pools = [MOCK_POOL_A, MOCK_POOL_B, MOCK_POOL_C];
    const opportunities = engine.findOpportunities(pools);

    expect(opportunities).toHaveLength(1);
    const opportunity = opportunities[0];
    expect(opportunity.type).toEqual('arbitrage');
    // We don't know the order, so check for both addresses
    expect([opportunity.path[0].address, opportunity.path[1].address]).toEqual(
      expect.arrayContaining([MOCK_POOL_A.address, MOCK_POOL_B.address])
    );
    expect(opportunity.profit).toBeGreaterThan(0);
  });

  it('should not find an opportunity if no price discrepancy exists', () => {
    const pools = [MOCK_POOL_A, { ...MOCK_POOL_A, address: '0x0000000000000000000000000000000000000001' }]; // Same price
    const opportunities = engine.findOpportunities(pools);
    expect(opportunities).toHaveLength(0);
  });
});