import { CcxtFetcher } from '../../src/protocols/CcxtFetcher';
import * as ccxt from 'ccxt';

// Mock the entire ccxt library
jest.mock('ccxt', () => ({
  pro: {
    binance: jest.fn().mockImplementation(() => ({
      fetchTicker: jest.fn(),
    })),
    kraken: jest.fn().mockImplementation(() => ({
      fetchTicker: jest.fn(),
    })),
    unsupportedex: jest.fn(), // Mock an exchange that exists but we might not want to support
  },
}));

describe('CcxtFetcher', () => {
  let binanceFetcher: CcxtFetcher;
  const mockBinance = new ccxt.pro.binance();

  beforeEach(() => {
    // Reset mocks before each test
    (ccxt.pro.binance as jest.Mock).mockClear();
    (mockBinance.fetchTicker as jest.Mock).mockClear();
    binanceFetcher = new CcxtFetcher('binance', 'test_key', 'test_secret');
  });

  it('should initialize the correct exchange with API credentials', () => {
    expect(ccxt.pro.binance).toHaveBeenCalledWith({
      apiKey: 'test_key',
      secret: 'test_secret',
    });
  });

  it('should initialize without API credentials if not provided', () => {
    new CcxtFetcher('kraken');
    expect(ccxt.pro.kraken).toHaveBeenCalledWith({});
  });

  describe('getTicker', () => {
    it('should fetch and return a correctly formatted ticker', async () => {
      const mockTicker = {
        symbol: 'BTC/USDT',
        last: 50000.0,
        baseVolume: 1000,
        // other properties are ignored
      };
      (mockBinance.fetchTicker as jest.Mock).mockResolvedValue(mockTicker);

      // Re-assign the fetcher to use the mocked instance
      (binanceFetcher as any).exchange = mockBinance;

      const tradePair = { base: 'BTC', quote: 'USDT' };
      const ticker = await binanceFetcher.getTicker(tradePair);

      expect(mockBinance.fetchTicker).toHaveBeenCalledWith('BTC/USDT');
      expect(ticker).toEqual({
        price: 50000.0,
        volume: 1000,
      });
    });

    it('should throw an error if the ticker has no last price', async () => {
      const mockTicker = { symbol: 'BTC/USDT', baseVolume: 1000 }; // No 'last' property
      (mockBinance.fetchTicker as jest.Mock).mockResolvedValue(mockTicker);
      (binanceFetcher as any).exchange = mockBinance;

      const tradePair = { base: 'BTC', quote: 'USDT' };
      await expect(binanceFetcher.getTicker(tradePair)).rejects.toThrow(
        'Ticker for BTC/USDT on binance is undefined or has no last price.'
      );
    });

    it('should re-throw errors from the ccxt library', async () => {
      const errorMessage = 'Network Error';
      (mockBinance.fetchTicker as jest.Mock).mockRejectedValue(new Error(errorMessage));
      (binanceFetcher as any).exchange = mockBinance;

      const tradePair = { base: 'BTC', quote: 'USDT' };
      await expect(binanceFetcher.getTicker(tradePair)).rejects.toThrow(errorMessage);
    });
  });
});