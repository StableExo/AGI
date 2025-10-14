import { BtccCustomFetcher } from '../../../src/protocols/btcc/BtccCustomFetcher';
import axios from 'axios';

// Mock the axios module
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BtccCustomFetcher', () => {
  let fetcher: BtccCustomFetcher;

  // Set up environment variables before each test
  beforeEach(() => {
    process.env.BTCC_API_KEY = 'test_key';
    process.env.BTCC_API_SECRET = 'test_secret';
    fetcher = new BtccCustomFetcher();
  });

  // Clear mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchPrice', () => {
    it('should return the last price for a given pair on successful API call', async () => {
      const mockPair = 'BTC/USDT';
      const mockPrice = 50000.12;
      const mockApiResponse = {
        result: {
          Last: mockPrice,
        },
        error: null,
        id: '1',
      };

      // Mock the GET request to return the successful response
      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

      const price = await fetcher.fetchPrice(mockPair);

      expect(price).toEqual(mockPrice);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      // Verify that the URL and parameters are correct
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/btcc_api_trade/market/detail'),
        expect.objectContaining({
          params: expect.objectContaining({
            symbol: 'BTCUSDT',
          }),
        }),
      );
    });

    it('should throw an error if the API response has an unexpected structure', async () => {
      const mockPair = 'BTC/USDT';
      const mockApiResponse = {
        result: {
          // Missing 'Last' field
        },
        error: null,
      };

      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

      // We expect the function to throw an error
      await expect(fetcher.fetchPrice(mockPair)).rejects.toThrow(
        `Unexpected response structure for ${mockPair}.`
      );
    });

    it('should re-throw an error if the axios request fails', async () => {
        const mockPair = 'BTC/USDT';
        const errorMessage = 'Network Error';
        mockedAxios.get.mockRejectedValue(new Error(errorMessage));

        await expect(fetcher.fetchPrice(mockPair)).rejects.toThrow(errorMessage);
      });
  });
});