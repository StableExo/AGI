import { FlashbotsBundleProvider, FlashbotsBundleResolution } from '@flashbots/ethers-provider-bundle';
import { JsonRpcProvider, Wallet } from 'ethers';
import { FlashbotsService } from '../../src/services/FlashbotsService';

// Mock the FlashbotsBundleProvider
jest.mock('@flashbots/ethers-provider-bundle', () => {
  const FlashbotsBundleResolution = {
    BundleIncluded: 'BundleIncluded',
    BlockPassedWithoutInclusion: 'BlockPassedWithoutInclusion',
    AccountNonceTooHigh: 'AccountNonceTooHigh',
  };

  return {
    FlashbotsBundleProvider: {
      create: jest.fn().mockResolvedValue({
        signBundle: jest.fn().mockResolvedValue('signed-bundle'),
        simulate: jest.fn().mockResolvedValue({ results: [] }),
        sendBundle: jest.fn().mockResolvedValue({
          wait: jest.fn().mockResolvedValue(FlashbotsBundleResolution.BundleIncluded),
        }),
      }),
    },
    FlashbotsBundleResolution,
  };
});

describe('FlashbotsService', () => {
  let flashbotsService: FlashbotsService;
  let mockProvider: JsonRpcProvider;
  let mockExecutionSigner: Wallet;

  beforeEach(() => {
    // Set up environment variables
    process.env.FLASHBOTS_AUTH_KEY = '0x1234567890123456789012345678901234567890123456789012345678901234';

    // Mock the ethers provider and signer
    mockProvider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
    } as unknown as JsonRpcProvider;
    mockExecutionSigner = new Wallet(process.env.FLASHBOTS_AUTH_KEY);

    flashbotsService = new FlashbotsService(mockProvider, mockExecutionSigner);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize correctly for a supported chain', async () => {
    await flashbotsService.initialize();
    expect(FlashbotsBundleProvider.create).toHaveBeenCalled();
  });

  it('should throw an error for an unsupported chain', async () => {
    (mockProvider.getNetwork as jest.Mock).mockResolvedValue({ chainId: 999 });
    await expect(flashbotsService.initialize()).rejects.toThrow('Flashbots is not supported on chain ID 999');
  });

  it('should send a bundle successfully', async () => {
    await flashbotsService.initialize();
    const result = await flashbotsService.sendBundle([], 123);
    expect(result).toBe(true);
  });

  it('should handle simulation failures', async () => {
    const mockSimulate = jest.fn().mockResolvedValue({ error: 'simulation error' });
    (FlashbotsBundleProvider.create as jest.Mock).mockResolvedValue({
      signBundle: jest.fn(),
      simulate: mockSimulate,
      sendBundle: jest.fn(),
    });

    await flashbotsService.initialize();
    const result = await flashbotsService.sendBundle([], 123);
    expect(result).toBe(false);
  });

  it('should handle bundle not being included', async () => {
    const mockWait = jest.fn().mockResolvedValue(FlashbotsBundleResolution.BlockPassedWithoutInclusion);
    const mockSendBundle = jest.fn().mockResolvedValue({ wait: mockWait });
    (FlashbotsBundleProvider.create as jest.Mock).mockResolvedValue({
      signBundle: jest.fn(),
      simulate: jest.fn().mockResolvedValue({ results: [] }),
      sendBundle: mockSendBundle,
    });

    await flashbotsService.initialize();
    const result = await flashbotsService.sendBundle([], 123);
    expect(result).toBe(false);
  });
});