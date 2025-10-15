import { AppController } from '../src/AppController';
import { StrategyEngine } from '../src/services/strategy.service';
import { ExecutionManager } from '../src/services/ExecutionManager';
import { ArbitrageOpportunity } from '../src/models/ArbitrageOpportunity';
import { FlashbotsService } from '../src/services/FlashbotsService';
import { BtccCustomFetcher } from '../src/protocols/btcc/BtccCustomFetcher';

// Mock the services
jest.mock('../src/services/strategy.service');
jest.mock('../src/services/ExecutionManager');
jest.mock('../src/services/FlashbotsService');
jest.mock('../src/protocols/btcc/BtccCustomFetcher');

const mockFindOpportunities = jest.fn();
const mockExecuteTrade = jest.fn();
const mockInitializeFlashbots = jest.fn().mockResolvedValue(undefined);

(StrategyEngine as jest.Mock).mockImplementation(() => ({
  findOpportunities: mockFindOpportunities,
}));

(ExecutionManager as jest.Mock).mockImplementation(() => ({
  executeTrade: mockExecuteTrade,
}));

(FlashbotsService as jest.Mock).mockImplementation(() => ({
  initialize: mockInitializeFlashbots,
}));

// Mock AppController.create to avoid real initialization
jest.spyOn(AppController, 'create').mockImplementation(async () => {
  // We can't directly instantiate AppController as its constructor is private.
  // So we create a mock version of it that has the method we need to test.
  const strategyEngine = new StrategyEngine(null as any);
  const executionManager = new ExecutionManager(null as any, null as any);
  const flashbotsService = new FlashbotsService(null as any, null as any);

  // This is a bit of a hack, but it allows us to test the runSingleCycle method
  // without having to deal with the private constructor.
  const appController = new (AppController as any)(
    null,
    executionManager,
    strategyEngine,
    flashbotsService
  );
  return appController;
});

const mockOpportunity = new ArbitrageOpportunity(100, [
  { action: 'Buy', exchange: 'exchangeA', pair: 'BTC/USDT', price: 50000, amount: 1 },
  { action: 'Sell', exchange: 'exchangeB', pair: 'BTC/USDT', price: 50100, amount: 1 },
]);

describe('AppController', () => {
  let appController: AppController;

  beforeAll(async () => {
    // Set up environment variables required by the AppController
    process.env.RPC_URL = 'http://localhost:8545';
    process.env.EXECUTION_PRIVATE_KEY = '0x0123456789012345678901234567890123456789012345678901234567890123';
    process.env.FLASHBOTS_AUTH_KEY = '0x0123456789012345678901234567890123456789012345678901234567890123';
    process.env.FLASH_SWAP_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';

    appController = await AppController.create();
  });

  beforeEach(() => {
    mockFindOpportunities.mockClear();
    mockExecuteTrade.mockClear();
  });

  it('should find and execute an opportunity', async () => {
    mockFindOpportunities.mockResolvedValue([mockOpportunity]);
    await appController.runSingleCycle();
    expect(mockFindOpportunities).toHaveBeenCalledTimes(1);
    expect(mockExecuteTrade).toHaveBeenCalledWith(mockOpportunity, process.env.FLASH_SWAP_CONTRACT_ADDRESS);
  });

  it('should not execute if no opportunities are found', async () => {
    mockFindOpportunities.mockResolvedValue([]);
    await appController.runSingleCycle();
    expect(mockFindOpportunities).toHaveBeenCalledTimes(1);
    expect(mockExecuteTrade).not.toHaveBeenCalled();
  });

  it('should handle errors from the strategy engine gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const testError = new Error('Strategy Engine Failed');
    mockFindOpportunities.mockRejectedValue(testError);

    await appController.runSingleCycle();

    expect(mockExecuteTrade).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('An error occurred during the analysis cycle:'),
      testError
    );
    consoleErrorSpy.mockRestore();
  });
});