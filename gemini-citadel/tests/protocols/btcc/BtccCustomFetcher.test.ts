import { BtccCustomFetcher } from '../../../src/protocols/btcc/BtccCustomFetcher';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BtccCustomFetcher', () => {
  let fetcher: BtccCustomFetcher;

  beforeEach(() => {
    fetcher = new BtccCustomFetcher();
    mockedAxios.get.mockClear();
  });

  it('should fetch a price correctly', async () => {
    const mockResponse = {
      data: {
        result: '52000.123',
      },
    };
    mockedAxios.get.mockResolvedValue(mockResponse);

    const price = await fetcher.fetchPrice('BTC/USDT');
    expect(price).toBe(52000.123);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://spotapi2.btcccdn.com/btcc_api_trade/market/last',
      { params: { market: 'BTCUSDT' } }
    );
  });

  it('should throw an error for an invalid pair format', async () => {
    await expect(fetcher.fetchPrice('BTC-USDT')).rejects.toThrow('Invalid pair format: BTC-USDT');
  });

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'Network Error';
    mockedAxios.get.mockRejectedValue(new Error(errorMessage));
    await expect(fetcher.fetchPrice('BTC/USDT')).rejects.toThrow(errorMessage);
  });

  it('should handle unexpected response structure', async () => {
    const mockResponse = {
      data: {
        // Missing 'result' field
      },
    };
    mockedAxios.get.mockResolvedValue(mockResponse);

    await expect(fetcher.fetchPrice('BTC/USDT')).rejects.toThrow(
      'Unexpected response structure for BTC/USDT.'
    );
  });

  it('should handle non-string result in response', async () => {
    const mockResponse = {
      data: {
        result: 12345, // result is a number, not a string
      },
    };
    mockedAxios.get.mockResolvedValue(mockResponse);

    await expect(fetcher.fetchPrice('BTC/USDT')).rejects.toThrow(
      'Unexpected response structure for BTC/USDT.'
    );
  });
});
