import { CexStrategyEngine } from '../../src/services/CexStrategyEngine';
import { ExchangeDataProvider } from '../../src/services/ExchangeDataProvider';
import { ExecutionManager } from '../../src/services/ExecutionManager';
import { MarketDataEvent } from '../../src/models/MarketDataEvent';
import { ArbitrageOpportunity } from '../../src/models/ArbitrageOpportunity';
import KafkaService from '../../src/services/KafkaService';

// Mock the KafkaService and capture the callback
let capturedCallback: (message: { value: Buffer | null }) => void;

jest.mock('../../src/services/KafkaService', () => ({
  __esModule: true,
  default: {
    subscribe: jest.fn().mockImplementation((topic, callback) => {
      capturedCallback = callback;
    }),
    connect: jest.fn(),
  },
}));

// Mock the dependencies
const mockDataProvider = {
  getCexFee: jest.fn().mockReturnValue(0.001), // 0.1% fee
} as unknown as ExchangeDataProvider;

const mockExecutionManager = {
  executeCexTrade: jest.fn(),
} as unknown as ExecutionManager;

describe('CexStrategyEngine', () => {
  let engine: CexStrategyEngine;

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Instantiate the engine with mocks
    engine = new CexStrategyEngine(mockDataProvider, mockExecutionManager);
    // Start the engine to register the subscription and capture the callback
    await engine.start();
  });

  it('should identify and execute a CEX arbitrage opportunity', async () => {
    // 1. Arrange: Create mock market data with a clear profitable opportunity
    const event1_coinbase: MarketDataEvent = {
      schema_version: '2.0.0',
      event_id: 'uuid-1',
      exchange: 'coinbase',
      symbol: 'BTC/USDT',
      bid: { price: 49950, quantity: 1, liquidity: 10 },
      ask: { price: 50000, quantity: 1, liquidity: 10 }, // We will BUY here
      spread: 50,
      spread_bps: 0.1,
      volume_24h: 1000,
      exchange_timestamp: Date.now(),
      processing_timestamp: Date.now(),
      latency_ms: 5,
      sequence_id: 1,
      is_snapshot: true,
    };

    const event2_btcc: MarketDataEvent = {
      schema_version: '2.0.0',
      event_id: 'uuid-2',
      exchange: 'btcc',
      symbol: 'BTC/USDT',
      bid: { price: 50200, quantity: 1, liquidity: 10 }, // We will SELL here
      ask: { price: 50250, quantity: 1, liquidity: 10 },
      spread: 50,
      spread_bps: 0.1,
      volume_24h: 1200,
      exchange_timestamp: Date.now(),
      processing_timestamp: Date.now(),
      latency_ms: 5,
      sequence_id: 1,
      is_snapshot: true,
    };

    // 2. Act: Simulate receiving the Kafka messages via the captured callback
    // First event populates the engine's internal state
    capturedCallback({ value: Buffer.from(JSON.stringify(event1_coinbase)) });
    await new Promise(resolve => setImmediate(resolve)); // Allow async operations to settle

    // Second event triggers the comparison and finds the opportunity.
    capturedCallback({ value: Buffer.from(JSON.stringify(event2_btcc)) });
    await new Promise(resolve => setImmediate(resolve)); // Allow async operations to settle

    // 3. Assert: Verify that the execution manager was called with the correct details
    expect(mockExecutionManager.executeCexTrade).toHaveBeenCalledTimes(1);

    const executedOpportunity: ArbitrageOpportunity = (mockExecutionManager.executeCexTrade as jest.Mock).mock.calls[0][0];

    // Calculate expected profit: (Sell Price * (1 - fee)) - (Buy Price * (1 + fee))
    const expectedProfit = (50200 * (1 - 0.001)) - (50000 * (1 + 0.001));
    expect(executedOpportunity.profit).toBe(BigInt(Math.trunc(expectedProfit)));

    const tradeActions = executedOpportunity.tradeActions;
    expect(tradeActions).toHaveLength(2);

    const buyAction = tradeActions.find(a => a.action === 'BUY');
    const sellAction = tradeActions.find(a => a.action === 'SELL');

    expect(buyAction).toBeDefined();
    expect(buyAction?.exchange).toBe('coinbase');
    expect(buyAction?.price).toBe(50000);

    expect(sellAction).toBeDefined();
    expect(sellAction?.exchange).toBe('btcc');
    expect(sellAction?.price).toBe(50200);
  });
});
