import { BtccCustomFetcher } from '../../../src/protocols/btcc/BtccCustomFetcher';
import axios from 'axios';

// Mock the axios module
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BtccCustomFetcher', () => {
  let fetcher: BtccCustomFetcher;

  beforeEach(() => {
    fetcher = new BtccCustomFetcher();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchPrice', () => {
    it('should return the last price for a given pair on successful API call', async () => {
      const mockPair = 'BTC/USDT';
      const mockPrice = 50000.12;
      const mockApiResponse = {
        result: `${mockPrice}`, // The API returns the price as a string
        error: null,
        id: 0,
        ttl: 400
      };

      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

      const price = await fetcher.fetchPrice(mockPair);

      expect(price).toEqual(mockPrice);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/btcc_api_trade/market/last'),
        {
          params: {
            market: 'BTCUSDT',
          },
        },
      );
    });

    it('should throw an error if the API response has an unexpected structure', async () => {
      const mockPair = 'BTC/USDT';
      const mockApiResponse = {
        result: { an: 'object' }, // Invalid structure
        error: null,
      };

      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

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