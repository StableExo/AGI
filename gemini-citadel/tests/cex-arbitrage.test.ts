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

    expect(opp.profit).toBeCloseTo(399.5);
    expect(opp.tradeActions).toHaveLength(2);

    const buyAction = opp.tradeActions.find(a => a.action === 'BUY');
    const sellAction = opp.tradeActions.find(a => a.action === 'SELL');

    expect(buyAction?.exchange).toBe('cex_a');
    expect(buyAction?.price).toBe(50000);
    expect(sellAction?.exchange).toBe('cex_b');
    expect(sellAction?.price).toBe(50500);
  });
});