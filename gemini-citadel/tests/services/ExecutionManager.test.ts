import { ExecutionManager } from '../../src/services/ExecutionManager';
import { ArbitrageOpportunity } from '../../src/models/ArbitrageOpportunity';
import { ITradeAction } from '../../src/models/ITradeAction';
import { ExchangeDataProvider } from '../../src/services/ExchangeDataProvider';
import { ICexExecutor } from '../../src/interfaces/ICexExecutor';
import { ITradeReceipt } from '../../src/interfaces/ITradeReceipt';
import logger from '../../src/services/logger.service';
import { TransactionService } from '../../src/services/TransactionService';

// Mock the dependencies
jest.mock('../../src/services/ExchangeDataProvider');
jest.mock('../../src/services/logger.service');
jest.mock('../../src/services/TransactionService');

describe('ExecutionManager', () => {
  let executionManager: ExecutionManager;
  let mockExchangeDataProvider: jest.Mocked<ExchangeDataProvider>;
  let mockBuyExecutor: jest.Mocked<ICexExecutor>;
  let mockSellExecutor: jest.Mocked<ICexExecutor>;
  let mockTransactionService: jest.Mocked<TransactionService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock CEX Executors
    mockBuyExecutor = {
      exchangeId: 'cex_a',
      placeOrder: jest.fn(),
      getOrderStatus: jest.fn(),
      getBalances: jest.fn(),
    };
    mockSellExecutor = {
      exchangeId: 'cex_b',
      placeOrder: jest.fn(),
      getOrderStatus: jest.fn(),
      getBalances: jest.fn(),
    };

    // Mock ExchangeDataProvider
    mockExchangeDataProvider = new (ExchangeDataProvider as any)([]);
    mockExchangeDataProvider.getExecutor = jest.fn((name: string) => {
      if (name === 'cex_a') return mockBuyExecutor as any;
      if (name === 'cex_b') return mockSellExecutor as any;
      return undefined;
    });

    mockTransactionService = new (TransactionService as any)();

    // Instantiate the ExecutionManager with all dependencies
    executionManager = new ExecutionManager(
      null as any, // flashbots
      null as any, // signer
      mockExchangeDataProvider,
      mockTransactionService
    );
  });

  const createCexOpportunity = (): ArbitrageOpportunity => {
    const buyAction: ITradeAction = { action: 'BUY', exchange: 'cex_a', pair: 'BTC/USDT', price: 50000, amount: 1 };
    const sellAction: ITradeAction = { action: 'SELL', exchange: 'cex_b', pair: 'BTC/USDT', price: 50100, amount: 1 };
    return new ArbitrageOpportunity(100, [buyAction, sellAction]);
  };

  it('should execute buy and sell orders on the correct CEX executors', async () => {
    const opportunity = createCexOpportunity();
    const mockBuyReceipt: ITradeReceipt = { success: true, orderId: 'buy123', filledAmount: 1 };
    const mockSellReceipt: ITradeReceipt = { success: true, orderId: 'sell456', filledAmount: 1 };
    mockBuyExecutor.placeOrder.mockResolvedValue(mockBuyReceipt);
    mockSellExecutor.placeOrder.mockResolvedValue(mockSellReceipt);

    await (executionManager as any).executeCexTrade(opportunity);

    expect(mockExchangeDataProvider.getExecutor).toHaveBeenCalledWith('cex_a');
    expect(mockExchangeDataProvider.getExecutor).toHaveBeenCalledWith('cex_b');
    expect(mockBuyExecutor.placeOrder).toHaveBeenCalledWith(opportunity.tradeActions[0]);
    expect(mockSellExecutor.placeOrder).toHaveBeenCalledWith(opportunity.tradeActions[1]);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Successfully executed CEX opportunity. Order IDs: buy123, sell456')
    );
  });

  it('should log an error if an executor cannot be found', async () => {
    const opportunity = createCexOpportunity();
    (mockExchangeDataProvider.getExecutor as jest.Mock).mockReturnValueOnce(undefined);

    await (executionManager as any).executeCexTrade(opportunity);

    expect(logger.error).toHaveBeenCalledWith("Could not find executor for exchange: cex_a");
    expect(mockBuyExecutor.placeOrder).not.toHaveBeenCalled();
    // The sell order should still be attempted, so we don't assert on it not being called.
  });

  it('should log an error if an order placement fails', async () => {
    const opportunity = createCexOpportunity();
    mockBuyExecutor.placeOrder.mockRejectedValue(new Error('Insufficient funds'));
    const mockSellReceipt: ITradeReceipt = { success: true, orderId: 'sell456', filledAmount: 1 };
    mockSellExecutor.placeOrder.mockResolvedValue(mockSellReceipt);

    await (executionManager as any).executeCexTrade(opportunity);

    expect(mockBuyExecutor.placeOrder).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      "Exception executing order on cex_a: Insufficient funds",
      expect.any(Error)
    );
    // The other order should still be attempted
    expect(mockSellExecutor.placeOrder).toHaveBeenCalled();
  });
});