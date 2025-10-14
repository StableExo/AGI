import { BtccFetcher } from '../src/protocols/btcc/BtccFetcher';
import * as ccxt from 'ccxt';

// Mock the ccxt library
jest.mock('ccxt', () => ({
  btcturk: jest.fn().mockImplementation(() => ({
    fetchTicker: jest.fn().mockResolvedValue({ last: 52000.0 }),
    fetchOrderBook: jest.fn().mockResolvedValue({ bids: [], asks: [] }),
  })),
}));

describe('BtccFetcher', () => {
  let fetcher: BtccFetcher;

  beforeEach(() => {
    // Clear all mocks before each test
    (ccxt.btcturk as jest.Mock).mockClear();
    fetcher = new BtccFetcher('DUMMY_KEY', 'DUMMY_SECRET');
  });

  it('should be instantiated correctly', () => {
    expect(fetcher).toBeInstanceOf(BtccFetcher);
    expect(ccxt.btcturk).toHaveBeenCalledWith({
      apiKey: 'DUMMY_KEY',
      secret: 'DUMMY_SECRET',
    });
  });

  it('should fetch a price correctly', async () => {
    const price = await fetcher.fetchPrice('BTC/USDT');
    expect(price).toBe(52000.0);
    const mockInstance = (ccxt.btcturk as jest.Mock).mock.results[0].value;
    expect(mockInstance.fetchTicker).toHaveBeenCalledWith('BTC/USDT');
  });

  it('should fetch an order book correctly', async () => {
    const orderBook = await fetcher.fetchOrderBook('BTC/USDT');
    expect(orderBook).toEqual({ bids: [], asks: [] });
    const mockInstance = (ccxt.btcturk as jest.Mock).mock.results[0].value;
    expect(mockInstance.fetchOrderBook).toHaveBeenCalledWith('BTC/USDT');
  });

  it('should handle errors when fetching price', async () => {
    const mockInstance = (ccxt.btcturk as jest.Mock).mock.results[0].value;
    mockInstance.fetchTicker.mockRejectedValue(new Error('Network Error'));
    await expect(fetcher.fetchPrice('BTC/USDT')).rejects.toThrow('Network Error');
  });
});