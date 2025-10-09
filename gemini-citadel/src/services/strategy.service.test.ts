import { StrategyEngine, Opportunity } from './strategy.service';
import { DataService } from './data.service';
import { Pool } from '../interfaces/Pool';

// Mock DataService
jest.mock('./data.service');

// Mock data using valid checksummed addresses and bigints
const MOCK_POOL_A: Pool = {
  address: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
  dex: 'UniswapV3',
  token0: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
  token1: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 },
  fee: 500,
  sqrtPriceX96: 2797883446869701119597357499268n, // Price ~1650
  liquidity: 1000000n,
  tick: 200000,
};

const MOCK_POOL_B: Pool = {
  ...MOCK_POOL_A,
  address: '0x8ad599c3A0b1A56214534e7850e24B4C640d00A6',
  sqrtPriceX96: 2825862281338301119597357499268n, // Price ~1680 (higher)
};

const MOCK_POOL_C: Pool = {
    ...MOCK_POOL_A,
    address: '0x1c3c3a4d7c5a8a1a3e4e9e8c9c8a4c3a2a1a3e4e',
    sqrtPriceX96: MOCK_POOL_A.sqrtPriceX96, // Same price as A
};

// Mock Pool Configurations
const MOCK_POOLS_CONFIG = [
    { name: 'Pool A', address: MOCK_POOL_A.address, tokenA: 'USDC', tokenB: 'WETH', fee: 500 },
    { name: 'Pool B', address: MOCK_POOL_B.address, tokenA: 'USDC', tokenB: 'WETH', fee: 500 },
];

const MOCK_POOLS_CONFIG_NO_OPPORTUNITY = [
    { name: 'Pool A', address: MOCK_POOL_A.address, tokenA: 'USDC', tokenB: 'WETH', fee: 500 },
    { name: 'Pool C', address: MOCK_POOL_C.address, tokenA: 'USDC', tokenB: 'WETH', fee: 500 },
];


describe('StrategyEngine', () => {
  let engine: StrategyEngine;
  let mockDataService: jest.Mocked<DataService>;

  beforeEach(() => {
    // Provide a mock implementation for the DataService constructor and methods
    mockDataService = new (DataService as any)('mock-rpc-url');
  });

  it('should find an opportunity when prices differ significantly', async () => {
    // Arrange: Configure the mock DataService to return different pools
    mockDataService.getV3PoolData.mockImplementation(async (address: string) => {
        if (address === MOCK_POOL_A.address) return MOCK_POOL_A;
        if (address === MOCK_POOL_B.address) return MOCK_POOL_B;
        throw new Error(`Unexpected pool address: ${address}`);
    });
    engine = new StrategyEngine(mockDataService, MOCK_POOLS_CONFIG);

    // Act: Run the engine
    const opportunities = await engine.findOpportunities();

    // Assert: Check that an opportunity was found
    expect(opportunities).toHaveLength(1);
    expect(opportunities[0].type).toBe('arbitrage');
    expect(opportunities[0].profit).toBeGreaterThan(0);
  });

  it('should not find an opportunity when prices are the same', async () => {
    // Arrange: Configure the mock DataService to return pools with the same price
    mockDataService.getV3PoolData.mockImplementation(async (address: string) => {
        if (address === MOCK_POOL_A.address) return MOCK_POOL_A;
        if (address === MOCK_POOL_C.address) return MOCK_POOL_C;
        throw new Error(`Unexpected pool address: ${address}`);
    });
    engine = new StrategyEngine(mockDataService, MOCK_POOLS_CONFIG_NO_OPPORTUNITY);

    // Act
    const opportunities = await engine.findOpportunities();

    // Assert
    expect(opportunities).toHaveLength(0);
  });

  it('should return the path with low price first, high price second', async () => {
    // Arrange: The config can be in any order, the logic should sort it.
    mockDataService.getV3PoolData.mockImplementation(async (address: string) => {
        if (address === MOCK_POOL_A.address) return MOCK_POOL_A; // Low price
        if (address === MOCK_POOL_B.address) return MOCK_POOL_B; // High price
        throw new Error(`Unexpected pool address: ${address}`);
    });
    // Initialize with inverted config order to test sorting
    engine = new StrategyEngine(mockDataService, [MOCK_POOLS_CONFIG[1], MOCK_POOLS_CONFIG[0]]);

    // Act
    const opportunities = await engine.findOpportunities();

    // Assert
    expect(opportunities).toHaveLength(1);
    const { path } = opportunities[0];
    expect(path[0].address).toBe(MOCK_POOL_A.address); // low price pool
    expect(path[1].address).toBe(MOCK_POOL_B.address); // high price pool
  });

  it('should handle errors from the data service gracefully', async () => {
    // Arrange
    const errorMessage = 'RPC Provider Error';
    mockDataService.getV3PoolData.mockRejectedValue(new Error(errorMessage));
    engine = new StrategyEngine(mockDataService, MOCK_POOLS_CONFIG);

    // Act & Assert
    // The error should be caught by the AppController, so the engine should throw it.
    await expect(engine.findOpportunities()).rejects.toThrow(errorMessage);
  });
});