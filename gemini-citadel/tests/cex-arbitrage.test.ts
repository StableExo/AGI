import { CexStrategyEngine } from '../src/services/CexStrategyEngine';
import { ExchangeDataProvider } from '../src/services/ExchangeDataProvider';
import { BtccFetcher } from '../src/protocols/BtccFetcher';
import { ICexFetcher, ITicker } from '../src/interfaces/ICexFetcher';
import { ITradePair } from '../src/interfaces/ITradePair';

// Mock the fetcher to avoid actual network calls
jest.mock('../src/protocols/BtccFetcher');

describe('CexStrategyEngine', () => {
  let dataProvider: ExchangeDataProvider;
  let strategyEngine: CexStrategyEngine;

  beforeEach(() => {
    // Reset mocks before each test
    (BtccFetcher as jest.Mock).mockClear();

    // Mock two different CEX fetchers for comparison
    const mockFetcherA = new BtccFetcher() as jest.Mocked<ICexFetcher>;
    mockFetcherA.exchangeId = 'cex_a';
    mockFetcherA.getTicker.mockImplementation(async (pair: ITradePair): Promise<ITicker> => {
      if (pair.base === 'BTC' && pair.quote === 'USDT') {
        return { price: 50000, volume: 100 };
      }
      throw new Error('Test pair not supported');
    });

    const mockFetcherB = new BtccFetcher() as jest.Mocked<ICexFetcher>;
    mockFetcherB.exchangeId = 'cex_b';
    mockFetcherB.getTicker.mockImplementation(async (pair: ITradePair): Promise<ITicker> => {
      if (pair.base === 'BTC' && pair.quote === 'USDT') {
        return { price: 50500, volume: 100 }; // Higher price on CEX B
      }
      throw new Error('Test pair not supported');
    });

    dataProvider = new ExchangeDataProvider([]);
    dataProvider.registerCexFetcher('cex_a', mockFetcherA, 0.001); // 0.1% fee
    dataProvider.registerCexFetcher('cex_b', mockFetcherB, 0.001); // 0.1% fee

    strategyEngine = new CexStrategyEngine(dataProvider);
  });

  it('should find a profitable arbitrage opportunity', async () => {
    const pairsToSearch: ITradePair[] = [{ base: 'BTC', quote: 'USDT' }];
    const opportunities = await strategyEngine.findOpportunities(pairsToSearch);

    expect(opportunities).toHaveLength(1);
    const opp = opportunities[0];

    expect(opp.buyOn).toBe('cex_a');
    expect(opp.sellOn).toBe('cex_b');
    expect(opp.buyPrice).toBe(50000);
    expect(opp.sellPrice).toBe(50500);

    // Profit calculation:
    // Sell revenue: 50500 * (1 - 0.001) = 50449.5
    // Buy cost: 50000 * (1 + 0.001) = 50050
    // Profit: 50449.5 - 50050 = 399.5
    expect(opp.potentialProfit).toBeCloseTo(399.5);
  });
});