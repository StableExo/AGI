import { ExchangeDataProvider } from '../src/services/ExchangeDataProvider';
import { IFetcher } from '../src/interfaces/IFetcher';
import { IExecutor } from '../src/interfaces/IExecutor';
import { IExchange } from '../src/interfaces/IExchange';

// Create a mock fetcher that conforms to the IFetcher interface
const mockFetcher: IFetcher = {
  fetchPrice: jest.fn().mockResolvedValue(100),
  fetchOrderBook: jest.fn().mockResolvedValue({ bids: [], asks: [] }),
};

// Create a mock executor that conforms to the IExecutor interface
const mockExecutor: IExecutor = {
  placeOrder: jest.fn().mockResolvedValue(true),
};

const mockExchange: IExchange = {
  name: 'mockex',
  fetcher: mockFetcher,
  executor: mockExecutor,
  fee: 0.001,
};

describe('ExchangeDataProvider', () => {
  it('should register and retrieve a fetcher', () => {
    const provider = new ExchangeDataProvider([mockExchange]);

    const retrievedFetcher = provider.getFetcher('mockex');
    expect(retrievedFetcher).toBe(mockFetcher);
  });

  it('should return undefined for a non-existent fetcher', () => {
    const provider = new ExchangeDataProvider([]);
    const retrievedFetcher = provider.getFetcher('nonexistent');
    expect(retrievedFetcher).toBeUndefined();
  });

  it('should return all registered fetchers', () => {
    const provider = new ExchangeDataProvider([mockExchange]);

    const allFetchers = provider.getAllFetchers();
    expect(allFetchers.size).toBe(1);
    expect(allFetchers.get('mockex')).toBe(mockFetcher);
  });
});