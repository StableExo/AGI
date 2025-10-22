import { CexStrategyEngine } from '../src/services/CexStrategyEngine';
import { ExchangeDataProvider } from '../src/services/ExchangeDataProvider';
import { ExecutionManager } from '../src/services/ExecutionManager';
import { MarketDataEvent } from '../src/models/MarketDataEvent';
import { ArbitrageOpportunity } from '../src/models/ArbitrageOpportunity';

// We only mock the dependencies, not the class under test
jest.mock('../src/services/ExchangeDataProvider');
jest.mock('../src/services/ExecutionManager');

describe('CexStrategyEngine Consumer', () => {
    let strategyEngine: CexStrategyEngine;
    let dataProviderMock: jest.Mocked<ExchangeDataProvider>;
    let executionManagerMock: jest.Mocked<ExecutionManager>;

    beforeEach(() => {
        dataProviderMock = new ExchangeDataProvider([]) as jest.Mocked<ExchangeDataProvider>;
        executionManagerMock = new ExecutionManager(null as any, null as any, null as any, null as any) as jest.Mocked<ExecutionManager>;
        // We create a real instance of the engine for this test
        strategyEngine = new CexStrategyEngine(dataProviderMock, executionManagerMock);

        // Manually initialize the private state for the test
        (strategyEngine as any).latestMarketData = new Map<string, MarketDataEvent>();

        // Mock the fees for the exchanges
        dataProviderMock.getCexFee.mockImplementation((exchangeId: string) => {
            if (exchangeId === 'kraken' || exchangeId === 'btcc') {
                return 0.001; // 0.1% fee
            }
            return 0;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should identify and execute a cross-exchange arbitrage opportunity', async () => {
        // 1. Set up the initial state: one price is already in the engine's state
        const storedEvent: MarketDataEvent = {
            schema_version: '2.0.0',
            event_id: 'test-uuid-1',
            exchange: 'btcc',
            symbol: 'BTC/USDT',
            bid: { price: 50000, quantity: 1, liquidity: 50000 },
            ask: { price: 50010, quantity: 1, liquidity: 50010 },
            spread: 10, spread_bps: 2, volume_24h: 1000,
            exchange_timestamp: Date.now(), processing_timestamp: Date.now(), latency_ms: 0,
            sequence_id: 1, is_snapshot: true,
        };
        (strategyEngine as any).latestMarketData.set('btcc:BTC/USDT', storedEvent);

        // 2. A new event arrives from a different exchange with a profitable price difference
        const newEvent: MarketDataEvent = {
            schema_version: '2.0.0',
            event_id: 'test-uuid-2',
            exchange: 'kraken',
            symbol: 'BTC/USDT',
            bid: { price: 50500, quantity: 1, liquidity: 50500 }, // Higher bid
            ask: { price: 50510, quantity: 1, liquidity: 50510 },
            spread: 10, spread_bps: 2, volume_24h: 1000,
            exchange_timestamp: Date.now(), processing_timestamp: Date.now(), latency_ms: 0,
            sequence_id: 1, is_snapshot: true,
        };

        // 3. Simulate the Kafka consumer receiving the message by calling the public handler
        await (strategyEngine as any).handleMarketData(JSON.stringify(newEvent));

        // 4. Verify the outcome
        expect(executionManagerMock.executeCexTrade).toHaveBeenCalledTimes(1);

        const capturedOpportunity: ArbitrageOpportunity = executionManagerMock.executeCexTrade.mock.calls[0][0];
        expect(capturedOpportunity).toBeInstanceOf(ArbitrageOpportunity);

        const buyAction = capturedOpportunity.tradeActions.find(a => a.action === 'BUY');
        const sellAction = capturedOpportunity.tradeActions.find(a => a.action === 'SELL');

        if (!buyAction || !sellAction) {
            throw new Error('Test setup failed: buy or sell action not found');
        }

        expect(buyAction.exchange).toBe('btcc');
        expect(buyAction.price).toBe(50010);
        expect(sellAction.exchange).toBe('kraken');
        expect(sellAction.price).toBe(50500);

        expect(capturedOpportunity.profit).toBeCloseTo(389.49);
    });
});
