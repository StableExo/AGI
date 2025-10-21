import { UniswapFetcher } from '../../src/protocols/UniswapFetcher';
import { UniswapLegacyService } from '../../src/services/UniswapLegacyService';

// Mock the UniswapLegacyService
jest.mock('../../src/services/UniswapLegacyService', () => ({
  UniswapLegacyService: jest.fn().mockImplementation(() => ({
    // Mock methods of UniswapLegacyService that are used by UniswapFetcher
  })),
}));

describe('UniswapFetcher', () => {
  let uniswapFetcher: UniswapFetcher;
  let mockUniswapService: UniswapLegacyService;

  beforeEach(() => {
    mockUniswapService = new UniswapLegacyService('', 1); // ChainId 1 for mainnet
    uniswapFetcher = new UniswapFetcher(mockUniswapService);
  });


  describe('fetchOrderBook', () => {
    it('should return an empty object as a placeholder', async () => {
      const pair = 'WETH/USDT';
      const orderBook = await uniswapFetcher.fetchOrderBook(pair);
      expect(orderBook).toEqual({});
    });
  });
});
