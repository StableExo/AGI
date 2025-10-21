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

  describe('fetchPrice', () => {
    it('should fetch and return a price for a given pair', async () => {
      const pair = 'WETH/USDT';
      const expectedPrice = 3000;

      // Mock the getPrice method on the UniswapLegacyService
      (mockUniswapService as any).getPrice = jest.fn().mockResolvedValue(expectedPrice);

      const price = await uniswapFetcher.fetchPrice(pair);

      expect(price).toBe(expectedPrice);
      expect(mockUniswapService.getPrice).toHaveBeenCalledWith(pair);
    });

    it('should throw an error if the price cannot be fetched', async () => {
      const pair = 'UNKNOWN/TOKEN';
      const errorMessage = 'Could not fetch price for UNKNOWN/TOKEN';

      (mockUniswapService as any).getPrice = jest.fn().mockRejectedValue(new Error(errorMessage));

      await expect(uniswapFetcher.fetchPrice(pair)).rejects.toThrow(errorMessage);
    });
  });

  describe('fetchOrderBook', () => {
    it('should return an empty object as a placeholder', async () => {
      const pair = 'WETH/USDT';
      const orderBook = await uniswapFetcher.fetchOrderBook(pair);
      expect(orderBook).toEqual({});
    });
  });
});
