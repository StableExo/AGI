import { StrategyEngine } from '../../src/services/strategy.service';
import { ExchangeDataProvider } from '../../src/services/ExchangeDataProvider';
import { BtccCustomFetcher } from '../../src/protocols/btcc/BtccCustomFetcher';
import { MockFetcher } from '../../src/protocols/mock/MockFetcher';
import { ITradeOpportunity } from '../../src/interfaces/ITradeOpportunity';

// Mock the fetcher modules
jest.mock('../../src/protocols/btcc/BtccCustomFetcher');
jest.mock('../../src/protocols/mock/MockFetcher');

describe('StrategyEngine', () => {
    let mockBtccFetcher: jest.Mocked<BtccCustomFetcher>;
    let mockMockFetcher: jest.Mocked<MockFetcher>;
    let dataProvider: ExchangeDataProvider;
    let strategyEngine: StrategyEngine;

    beforeEach(() => {
        // Create new instances of the mocked fetchers for each test
        mockBtccFetcher = new BtccCustomFetcher() as jest.Mocked<BtccCustomFetcher>;
        mockMockFetcher = new MockFetcher() as jest.Mocked<MockFetcher>;

        // Setup the data provider with the mocked fetchers and fees
        dataProvider = new ExchangeDataProvider(
            [
                { name: 'btcc', instance: mockBtccFetcher, fee: 0.001 }, // 0.1% fee
                { name: 'mockExchange', instance: mockMockFetcher, fee: 0.001 }, // 0.1% fee
            ],
            [] // No executors needed for this test
        );

        strategyEngine = new StrategyEngine(dataProvider);

        // Mock the implementation of setBasePrice for the MockFetcher
        // This is a bit of a workaround because we are mocking the whole class.
        // In a real scenario with more complex mocks, we might use jest.spyOn.
        let basePrice = 0;
        (mockMockFetcher.setBasePrice as jest.Mock).mockImplementation((price: number) => {
            basePrice = price;
        });

        // Ensure fetchPrice on the mock returns the basePrice * multiplier
        (mockMockFetcher.fetchPrice as jest.Mock).mockImplementation(async (_pair: string) => {
            return basePrice * 1.003; // Simulate a 0.3% higher price
        });
    });

    it('should identify a profitable opportunity when spread exceeds fees', async () => {
        // Arrange: BTCC price is 50000
        mockBtccFetcher.fetchPrice.mockResolvedValue(50000);

        // Act
        const opportunities = await strategyEngine.findOpportunities();

        // Assert
        expect(opportunities).toHaveLength(1);
        const opportunity = opportunities[0];
        expect(opportunity.type).toBe('Arbitrage');

        // 50000 * 1.003 = 50150. Spread = 150.
        // Fees = (50000 * 0.001) + (50150 * 0.001) = 50 + 50.15 = 100.15
        // Profit = 150 - 100.15 = 49.85
        expect(opportunity.estimatedProfit).toBeCloseTo(49.85);
        expect(opportunity.actions).toHaveLength(2);

        const buyAction = opportunity.actions.find(a => a.action === 'Buy');
        const sellAction = opportunity.actions.find(a => a.action === 'Sell');

        expect(buyAction?.exchange).toBe('btcc');
        expect(buyAction?.price).toBe(50000);
        expect(sellAction?.exchange).toBe('mockExchange');
        expect(sellAction?.price).toBeCloseTo(50150);
    });

    it('should NOT identify an opportunity when spread is less than fees', async () => {
        // Arrange: Modify the mock fetcher to return a smaller spread
        (mockMockFetcher.fetchPrice as jest.Mock).mockImplementation(async (_pair: string) => {
            // Price is only 0.15% higher, spread (75) should be less than fees (~100)
            const basePrice = (await mockBtccFetcher.fetchPrice(_pair));
            return basePrice * 1.0015;
        });
        mockBtccFetcher.fetchPrice.mockResolvedValue(50000);

        // Act
        const opportunities = await strategyEngine.findOpportunities();

        // Assert
        expect(opportunities).toHaveLength(0);
    });

    it('should NOT identify an opportunity when there is no price difference', async () => {
        // Arrange: Modify the mock fetcher to return the same price
        (mockMockFetcher.fetchPrice as jest.Mock).mockImplementation(async (_pair: string) => {
            return mockBtccFetcher.fetchPrice(_pair);
        });
        mockBtccFetcher.fetchPrice.mockResolvedValue(50000);

        // Act
        const opportunities = await strategyEngine.findOpportunities();

        // Assert
        expect(opportunities).toHaveLength(0);
    });
});