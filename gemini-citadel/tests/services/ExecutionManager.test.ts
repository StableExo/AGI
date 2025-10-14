import { ExecutionManager } from '../../src/services/ExecutionManager';
import { ExchangeDataProvider } from '../../src/services/ExchangeDataProvider';
import { MockExecutor } from '../../src/protocols/mock/MockExecutor';
import { ITradeOpportunity, ITradeAction } from '../../src/interfaces/ITradeOpportunity';

// Mock the ExchangeDataProvider
jest.mock('../../src/services/ExchangeDataProvider');

describe('ExecutionManager', () => {
  let executionManager: ExecutionManager;
  let mockDataProvider: jest.Mocked<ExchangeDataProvider>;
  let mockSuccessExecutor: MockExecutor;
  let mockFailureExecutor: MockExecutor;

  // Define a mock pair string, as required by the ITradeAction interface
  const MOCK_PAIR = 'BTC/USDT';

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create a mock that successfully returns a receipt
    mockSuccessExecutor = new MockExecutor();
    jest.spyOn(mockSuccessExecutor, 'placeOrder').mockResolvedValue({
      success: true,
      orderId: 'mock-success-123',
      filledAmount: 1,
    });

    // Create a mock that simulates a failed order
    mockFailureExecutor = new MockExecutor();
    jest.spyOn(mockFailureExecutor, 'placeOrder').mockResolvedValue({
      success: false,
      orderId: 'mock-fail-456',
      filledAmount: 0,
      message: 'Insufficient funds',
    });

    // We instantiate the mock of ExchangeDataProvider, not the real class
    mockDataProvider = new (ExchangeDataProvider as jest.Mock<ExchangeDataProvider>)() as any;

    // Set up the mock getExecutor to return our mock executors
    mockDataProvider.getExecutor.mockImplementation((name: string) => {
      if (name === 'exchange-success') return mockSuccessExecutor;
      if (name === 'exchange-fail') return mockFailureExecutor;
      return undefined;
    });

    // Instantiate the ExecutionManager with the mocked provider
    executionManager = new ExecutionManager(mockDataProvider);
  });

  it('should successfully execute a valid trade opportunity', async () => {
    const opportunity: ITradeOpportunity = {
      type: 'Arbitrage',
      actions: [
        { exchange: 'exchange-success', action: 'Buy', pair: MOCK_PAIR, price: 100, amount: 1 },
        { exchange: 'exchange-success', action: 'Sell', pair: MOCK_PAIR, price: 101, amount: 1 },
      ],
      estimatedProfit: 1,
    };

    const receipts = await executionManager.executeTrade(opportunity);

    expect(receipts).toHaveLength(2);
    expect(receipts[0].success).toBe(true);
    expect(receipts[1].success).toBe(true);
    expect(mockDataProvider.getExecutor).toHaveBeenCalledTimes(2);
    expect(mockSuccessExecutor.placeOrder).toHaveBeenCalledTimes(2);
  });

  it('should throw a critical error if a second action fails (Halt and Alert)', async () => {
    const opportunity: ITradeOpportunity = {
      type: 'Arbitrage',
      actions: [
        { exchange: 'exchange-success', action: 'Buy', pair: MOCK_PAIR, price: 100, amount: 1 },
        { exchange: 'exchange-fail', action: 'Sell', pair: MOCK_PAIR, price: 101, amount: 1 },
      ],
      estimatedProfit: 1,
    };

    // We expect the executeTrade function to throw an error
    await expect(executionManager.executeTrade(opportunity)).rejects.toThrow(
      /CRITICAL: Legged trade!/
    );

    // Verify that the first action was attempted, but the second one failed and halted everything
    expect(mockDataProvider.getExecutor).toHaveBeenCalledTimes(2);
    expect(mockSuccessExecutor.placeOrder).toHaveBeenCalledTimes(1); // First action succeeds
    expect(mockFailureExecutor.placeOrder).toHaveBeenCalledTimes(1); // Second action fails
  });

  it('should throw an error if no executor is found for an exchange', async () => {
    const opportunity: ITradeOpportunity = {
      type: 'Arbitrage',
      actions: [
        { exchange: 'non-existent-exchange', action: 'Buy', pair: MOCK_PAIR, price: 100, amount: 1 },
      ],
      estimatedProfit: 1,
    };

    await expect(executionManager.executeTrade(opportunity)).rejects.toThrow(
      /CRITICAL: No executor found for exchange: "non-existent-exchange"/
    );
  });

  // This test doesn't directly test the BtccExecutor's internal logic,
  // but it ensures the overall flow can be tested with a dry-run like executor.
  it('should correctly handle executors that return dry-run receipts', async () => {
    // Configure the success executor to return a "dry run" style message
    jest.spyOn(mockSuccessExecutor, 'placeOrder').mockResolvedValue({
      success: true,
      orderId: 'dry-run-789',
      filledAmount: 1,
      message: 'Dry run execution successful.',
    });

    const opportunity: ITradeOpportunity = {
      type: 'Arbitrage',
      actions: [
        { exchange: 'exchange-success', action: 'Buy', pair: MOCK_PAIR, price: 100, amount: 1 },
      ],
      estimatedProfit: 1,
    };

    const receipts = await executionManager.executeTrade(opportunity);
    expect(receipts).toHaveLength(1);
    expect(receipts[0].success).toBe(true);
    expect(receipts[0].message).toContain('Dry run');
  });
});