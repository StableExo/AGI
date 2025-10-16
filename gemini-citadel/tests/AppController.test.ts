import { AppController } from '../src/AppController';
import { StrategyEngine } from '../src/services/strategy.service';
import { ExecutionManager } from '../src/services/ExecutionManager';
import { ArbitrageOpportunity } from '../src/models/ArbitrageOpportunity';
import { FlashbotsService } from '../src/services/FlashbotsService';
import { BtccCustomFetcher } from '../src/protocols/btcc/BtccCustomFetcher';
import logger from '../src/services/logger.service';

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

const mockOpportunity = new ArbitrageOpportunity(100, [
  { action: 'Buy', exchange: 'exchangeA', pair: 'BTC/USDT', price: 50000, amount: 1 },
  { action: 'Sell', exchange: 'exchangeB', pair: 'BTC/USDT', price: 50100, amount: 1 },
]);

describe('AppController', () => {
  let appController: AppController;
  let strategyEngine: StrategyEngine;
  let executionManager: ExecutionManager;
  let flashbotsService: FlashbotsService;

  beforeEach(() => {
    mockFindOpportunities.mockClear();
    mockExecuteTrade.mockClear();

    // Instantiate mocks
    strategyEngine = new (StrategyEngine as any)(null);
    executionManager = new (ExecutionManager as any)(null, null);
    flashbotsService = new (FlashbotsService as any)(null, null);

    // Instantiate the controller with mocks
    appController = new AppController(
      null as any, // dataProvider is not used in AppController methods directly
      executionManager,
      strategyEngine,
      flashbotsService
    );
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
    const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation();
    const testError = new Error('Strategy Engine Failed');
    mockFindOpportunities.mockRejectedValue(testError);

    await appController.runSingleCycle();

    expect(mockExecuteTrade).not.toHaveBeenCalled();
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      `[AppController] An error occurred during the analysis cycle:`,
      testError
    );
    loggerErrorSpy.mockRestore();
  });
});