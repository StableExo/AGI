import { ExchangeDataProvider } from '../src/services/ExchangeDataProvider';
import { IFetcher } from '../src/interfaces/IFetcher';

// Create a mock fetcher that conforms to the IFetcher interface
const mockFetcher: IFetcher = {
  fetchPrice: jest.fn().mockResolvedValue(100),
  fetchOrderBook: jest.fn().mockResolvedValue({ bids: [], asks: [] }),
};

describe('ExchangeDataProvider', () => {
  it('should register and retrieve a fetcher', () => {
    const provider = new ExchangeDataProvider(
      [{ name: 'mockex', instance: mockFetcher, fee: 0.001 }],
      []
    );

    const retrievedFetcher = provider.getFetcher('mockex');
    expect(retrievedFetcher).toBe(mockFetcher);
  });

  it('should return undefined for a non-existent fetcher', () => {
    const provider = new ExchangeDataProvider([], []);
    const retrievedFetcher = provider.getFetcher('nonexistent');
    expect(retrievedFetcher).toBeUndefined();
  });

  it('should return all registered fetchers', () => {
    const provider = new ExchangeDataProvider(
      [{ name: 'mockex', instance: mockFetcher, fee: 0.001 }],
      []
    );

    const allFetchers = provider.getAllFetchers();
    expect(allFetchers.size).toBe(1);
    expect(allFetchers.get('mockex')).toBe(mockFetcher);
  });
});