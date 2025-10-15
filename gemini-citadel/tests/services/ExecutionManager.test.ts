import { Wallet, ethers } from 'ethers';
import { ExecutionManager } from '../../src/services/ExecutionManager';
import { FlashbotsService } from '../../src/services/FlashbotsService';
import { ArbitrageOpportunity } from '../../src/models/ArbitrageOpportunity';
import { ITradeAction, ISwapStep } from '../../src/interfaces/ITradeAction';

// Mock the FlashbotsService
jest.mock('../../src/services/FlashbotsService');

describe('ExecutionManager', () => {
  let executionManager: ExecutionManager;
  let mockFlashbotsService: jest.Mocked<FlashbotsService>;
  let mockSigner: Wallet;

  const MOCK_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';
  const MOCK_POOL_ADDRESS = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
  const MOCK_TOKEN_ADDRESS = '0x0987654321098765432109876543210987654321';

  beforeEach(() => {
    jest.clearAllMocks();

    // We need a mock signer with a provider to get chainId
    const mockProvider = {
      getBlockNumber: jest.fn().mockResolvedValue(12345),
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
    };
    mockSigner = new Wallet(ethers.Wallet.createRandom().privateKey, mockProvider as any);

    // Mock FlashbotsService
    mockFlashbotsService = new (FlashbotsService as any)(null, null);
    mockFlashbotsService.sendBundle = jest.fn();

    // Instantiate the ExecutionManager with mocks
    executionManager = new ExecutionManager(mockFlashbotsService, mockSigner);
  });

  const createMockOpportunity = (): ArbitrageOpportunity => {
    const swapStep: ISwapStep = {
      dexType: 0,
      tokenIn: MOCK_TOKEN_ADDRESS,
      tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH Address
      minAmountOut: 100,
      poolOrRouter: MOCK_POOL_ADDRESS,
      poolFee: 3000,
    };

    const action: ITradeAction = {
      action: 'Buy',
      exchange: 'UniswapV3',
      pair: 'WETH/DAI',
      price: 1500,
      amount: 1,
      onChainData: swapStep,
    };

    const opportunity = new ArbitrageOpportunity(25, [action]);
    opportunity.setFlashLoanDetails(MOCK_POOL_ADDRESS, MOCK_TOKEN_ADDRESS, 1000);
    return opportunity;
  };

  it('should successfully submit a trade to the FlashbotsService', async () => {
    const opportunity = createMockOpportunity();
    (mockFlashbotsService.sendBundle as jest.Mock).mockResolvedValue(true);

    const wasIncluded = await executionManager.executeTrade(opportunity, MOCK_CONTRACT_ADDRESS);

    expect(wasIncluded).toBe(true);
    expect(mockFlashbotsService.sendBundle).toHaveBeenCalledTimes(1);
    const bundle = (mockFlashbotsService.sendBundle as jest.Mock).mock.calls[0][0];
    expect(bundle).toHaveLength(1);
    expect(bundle[0].transaction.to).toEqual(MOCK_CONTRACT_ADDRESS);
    expect(bundle[0].signer).toBe(mockSigner);
  });

  it('should return false if the Flashbots bundle is not included', async () => {
    const opportunity = createMockOpportunity();
    (mockFlashbotsService.sendBundle as jest.Mock).mockResolvedValue(false);

    const wasIncluded = await executionManager.executeTrade(opportunity, MOCK_CONTRACT_ADDRESS);

    expect(wasIncluded).toBe(false);
    expect(mockFlashbotsService.sendBundle).toHaveBeenCalledTimes(1);
  });

  it('should return false and log an error if FlashbotsService throws an error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const testError = new Error('Flashbots relay error');
    const opportunity = createMockOpportunity();
    (mockFlashbotsService.sendBundle as jest.Mock).mockRejectedValue(testError);

    const wasIncluded = await executionManager.executeTrade(opportunity, MOCK_CONTRACT_ADDRESS);

    expect(wasIncluded).toBe(false);
    expect(mockFlashbotsService.sendBundle).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `[ExecutionManager] CRITICAL: Failed to submit Flashbots bundle. Error: ${testError.message}`
    );

    consoleErrorSpy.mockRestore();
  });

  it('should throw an error if an action is missing onChainData', async () => {
    const opportunity = createMockOpportunity();
    opportunity.actions[0].onChainData = undefined; // Remove essential data

    // Using a try-catch block to assert the error message
    try {
      await executionManager.executeTrade(opportunity, MOCK_CONTRACT_ADDRESS);
      fail('Expected executeTrade to throw an error but it did not.');
    } catch (e: any) {
      expect(e.message).toContain('Action is missing on-chain data');
    }
  });
});