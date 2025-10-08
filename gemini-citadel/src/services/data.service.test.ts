import { DataService } from './data.service';
import { Contract as ContractV6 } from 'ethers';
import { Contract as ContractV5 } from 'ethers-v5';

// Mock the ethers v6 Contract module
jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'), // Import and retain default exports
  Contract: jest.fn(),
  JsonRpcProvider: jest.fn().mockImplementation(() => ({
    // Mock any methods needed on the provider instance if necessary
  })),
}));

// Mock the ethers-v5 Contract module
jest.mock('ethers-v5', () => ({
  ...jest.requireActual('ethers-v5'),
  Contract: jest.fn(),
  providers: {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      // Mock any methods needed on the v5 provider instance
    })),
  },
}));

// Create typed mock variables using the correct casting
const mockedContractV6 = ContractV6 as unknown as jest.Mock;
const mockedContractV5 = ContractV5 as unknown as jest.Mock;


describe('DataService', () => {
  const MOCK_RPC_URL = 'http://localhost:8545';
  const MOCK_POOL_ADDRESS = '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640';
  const MOCK_TOKEN0_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const MOCK_TOKEN1_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

  let dataService: DataService;

  beforeEach(() => {
    // Reset mocks before each test
    mockedContractV5.mockClear();
    mockedContractV6.mockClear();
    dataService = new DataService(MOCK_RPC_URL);
  });

  it('should fetch and correctly format V3 pool data on the happy path', async () => {
    // --- Mocks ---
    // Mock for ethers-v5 (Uniswap Pool Contract)
    const mockV5Contract = {
      slot0: jest.fn().mockResolvedValue({ sqrtPriceX96: 12345n, tick: 123 }),
      liquidity: jest.fn().mockResolvedValue(1000000n),
      token0: jest.fn().mockResolvedValue(MOCK_TOKEN0_ADDRESS),
      token1: jest.fn().mockResolvedValue(MOCK_TOKEN1_ADDRESS),
      fee: jest.fn().mockResolvedValue(500),
    };
    mockedContractV5.mockImplementation(() => mockV5Contract);

    // Mocks for ethers-v6 (ERC20 Token Contracts)
    const mockToken0Contract = {
      symbol: jest.fn().mockResolvedValue('USDC'),
      decimals: jest.fn().mockResolvedValue(6),
    };
    const mockToken1Contract = {
      symbol: jest.fn().mockResolvedValue('WETH'),
      decimals: jest.fn().mockResolvedValue(18),
    };

    mockedContractV6.mockImplementation((address) => {
      if (address === MOCK_TOKEN0_ADDRESS) return mockToken0Contract;
      if (address === MOCK_TOKEN1_ADDRESS) return mockToken1Contract;
      return {}; // Should not happen in this test
    });

    // --- Execution ---
    const poolData = await dataService.getV3PoolData(MOCK_POOL_ADDRESS);

    // --- Assertions ---
    expect(poolData).toBeDefined();
    expect(poolData.address).toEqual(MOCK_POOL_ADDRESS);
    expect(poolData.dex).toEqual('UniswapV3');
    expect(poolData.fee).toEqual(500);

    // Token 0 assertions
    expect(poolData.token0.address).toEqual(MOCK_TOKEN0_ADDRESS);
    expect(poolData.token0.symbol).toEqual('USDC');
    expect(poolData.token0.decimals).toEqual(6);

    // Token 1 assertions
    expect(poolData.token1.address).toEqual(MOCK_TOKEN1_ADDRESS);
    expect(poolData.token1.symbol).toEqual('WETH');
    expect(poolData.token1.decimals).toEqual(18);
  });

  it('should throw an error if a contract call fails', async () => {
    // --- Mocks ---
    const errorMessage = 'RPC call failed';
    mockedContractV5.mockImplementation(() => ({
      slot0: jest.fn().mockRejectedValue(new Error(errorMessage)),
      liquidity: jest.fn().mockResolvedValue(1000000n),
      token0: jest.fn().mockResolvedValue(MOCK_TOKEN0_ADDRESS),
      token1: jest.fn().mockResolvedValue(MOCK_TOKEN1_ADDRESS),
      fee: jest.fn().mockResolvedValue(500),
    }));

    // --- Execution & Assertions ---
    await expect(dataService.getV3PoolData(MOCK_POOL_ADDRESS))
      .rejects
      .toThrow(`Failed to fetch data for V3 pool ${MOCK_POOL_ADDRESS}`);
  });
});