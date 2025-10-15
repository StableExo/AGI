import { AppController } from '../src/AppController';
import { StrategyEngine } from '../src/services/strategy.service';
import { ExecutionManager } from '../src/services/ExecutionManager';
import { ExchangeDataProvider } from '../src/services/ExchangeDataProvider';
import { ArbitrageOpportunity } from '../src/models/ArbitrageOpportunity';

// Mock the entire modules for the services
jest.mock('../src/services/strategy.service');
jest.mock('../src/services/ExecutionManager');
jest.mock('../src/services/ExchangeDataProvider');
jest.mock('../src/protocols/btcc/BtccCustomFetcher');
jest.mock('../src/protocols/mock/MockFetcher');
jest.mock('../src/protocols/btcc/BtccExecutor');
jest.mock('../src/protocols/mock/MockExecutor');


// Create mock instances that we can control directly
const mockFindOpportunities = jest.fn();
const mockExecuteTrade = jest.fn();

// Provide a mock implementation for the constructors
(StrategyEngine as jest.Mock).mockImplementation(() => ({
  findOpportunities: mockFindOpportunities,
}));
(ExecutionManager as jest.Mock).mockImplementation(() => ({
  executeTrade: mockExecuteTrade,
}));
// Mock the other constructors as well to satisfy the AppController
(ExchangeDataProvider as jest.Mock).mockImplementation(() => ({}));


const mockOpportunity = new ArbitrageOpportunity(
  100,
  { action: 'Buy', exchange: 'exchangeA', pair: 'BTC/USDT', price: 50000, amount: 1 },
  { action: 'Sell', exchange: 'exchangeB', pair: 'BTC/USDT', price: 50100, amount: 1 }
);

describe('AppController', () => {
  let appController: AppController;

  beforeEach(() => {
    // Clear all mocks before each test
    mockFindOpportunities.mockClear();
    mockExecuteTrade.mockClear();
    (StrategyEngine as jest.Mock).mockClear();
    (ExecutionManager as jest.Mock).mockClear();

    // Set up environment variables for the test
    process.env.BTCC_API_KEY = 'test-key';
    process.env.BTCC_API_SECRET = 'test-secret';

    // Instantiate the controller, which will now use our controlled mocks
    appController = new AppController();
  });

  it('should find and execute an opportunity', async () => {
    // Arrange
    mockFindOpportunities.mockResolvedValue([mockOpportunity]);

    // Act
    await appController.runSingleCycle();

    // Assert
    expect(mockFindOpportunities).toHaveBeenCalledTimes(1);
    expect(mockExecuteTrade).toHaveBeenCalledWith(mockOpportunity);
  });

  it('should not execute if no opportunities are found', async () => {
    // Arrange
    mockFindOpportunities.mockResolvedValue([]);

    // Act
    await appController.runSingleCycle();

    // Assert
    expect(mockFindOpportunities).toHaveBeenCalledTimes(1);
    expect(mockExecuteTrade).not.toHaveBeenCalled();
  });

  it('should handle errors from the strategy engine gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const testError = new Error('Strategy Engine Failed');

    // Arrange
    mockFindOpportunities.mockRejectedValue(testError);

    // Act
    await appController.runSingleCycle();

    // Assert
    expect(mockExecuteTrade).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('An error occurred during the analysis cycle:'), testError);

    consoleErrorSpy.mockRestore();
  });
});