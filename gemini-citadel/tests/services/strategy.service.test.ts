import { StrategyEngine } from '../../src/services/strategy.service';
import { ExchangeDataProvider } from '../../src/services/ExchangeDataProvider';
import { ArbitrageOpportunity } from '../../src/models/ArbitrageOpportunity';
import { IFetcher } from '../../src/interfaces/IFetcher';

// Mocking the IFetcher interface for our tests
class MockTestFetcher implements IFetcher {
  constructor(private price: number) {}
  async fetchPrice(pair: string): Promise<number> {
    return this.price;
  }
  async fetchOrderBook(pair: string): Promise<any> {
    // This is not used by the StrategyEngine, so we can return a mock value.
    return { bids: [], asks: [] };
  }
}

describe('StrategyEngine', () => {
  let strategyEngine: StrategyEngine;
  let dataProvider: ExchangeDataProvider;

  beforeEach(() => {
    // We initialize a new ExchangeDataProvider for each test to ensure isolation.
    // The fetchers and executors arrays are empty because we will mock the necessary methods.
    dataProvider = new ExchangeDataProvider([]);
    strategyEngine = new StrategyEngine(dataProvider);
  });

  it('should identify a profitable arbitrage opportunity', async () => {
    // Arrange: Set up a scenario where buying on exchangeA and selling on exchangeB is profitable.
    const fetcherA = new MockTestFetcher(100); // Buy price
    const fetcherB = new MockTestFetcher(105); // Sell price
    const fetchers = new Map<string, IFetcher>([
      ['exchangeA', fetcherA],
      ['exchangeB', fetcherB],
    ]);
    jest.spyOn(dataProvider, 'getAllFetchers').mockReturnValue(fetchers);
    jest.spyOn(dataProvider, 'getFee').mockReturnValue(0.001); // 0.1% fee

    // Act: Run the opportunity finding logic.
    const opportunities = await strategyEngine.findOpportunities();

    // Assert: Verify that one opportunity was found and its details are correct.
    expect(opportunities).toHaveLength(1);
    const opportunity = opportunities[0];
    expect(opportunity).toBeInstanceOf(ArbitrageOpportunity);
    // Profit = (105 - 100) - (100 * 0.001 + 105 * 0.001) = 5 - 0.205 = 4.795
    expect(opportunity.profit).toBeCloseTo(4.795);
    expect(opportunity.tradeActions[0].action).toBe('BUY');
    expect(opportunity.tradeActions[0].exchange).toBe('exchangeA');
    expect(opportunity.tradeActions[1].action).toBe('SELL');
    expect(opportunity.tradeActions[1].exchange).toBe('exchangeB');
  });

  it('should not identify an opportunity if the profit is below the threshold', async () => {
    // Arrange: Set up a scenario where the spread is too small to be profitable after fees.
    const fetcherA = new MockTestFetcher(100);
    const fetcherB = new MockTestFetcher(100.1);
    const fetchers = new Map<string, IFetcher>([
      ['exchangeA', fetcherA],
      ['exchangeB', fetcherB],
    ]);
    jest.spyOn(dataProvider, 'getAllFetchers').mockReturnValue(fetchers);
    jest.spyOn(dataProvider, 'getFee').mockReturnValue(0.001);

    // Act: Run the opportunity finding logic.
    const opportunities = await strategyEngine.findOpportunities();

    // Assert: Verify that no opportunity was found.
    expect(opportunities).toHaveLength(0);
  });

  it('should not identify an opportunity if there are not enough pricing sources', async () => {
    // Arrange: Set up a scenario with only one fetcher.
    const fetcherA = new MockTestFetcher(100);
    const fetchers = new Map<string, IFetcher>([
      ['exchangeA', fetcherA],
    ]);
    jest.spyOn(dataProvider, 'getAllFetchers').mockReturnValue(fetchers);

    // Act: Run the opportunity finding logic.
    const opportunities = await strategyEngine.findOpportunities();

    // Assert: Verify that no opportunity was found.
    expect(opportunities).toHaveLength(0);
  });
});