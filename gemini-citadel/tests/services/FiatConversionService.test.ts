import axios from 'axios';
import { fiatConversionService } from '../../src/services/FiatConversionService';
import logger from '../../src/services/logger.service';

jest.mock('axios');
jest.mock('../../src/services/logger.service');

const mockApiData = [
  { symbol: 'BTC-USD', last_trade_price: 50000.0, price_24h: 49000, volume_24h: 1000 },
  { symbol: 'BTC-EUR', last_trade_price: 45000.0, price_24h: 44000, volume_24h: 900 },
  { symbol: 'BTC-GBP', last_trade_price: 40000.0, price_24h: 39000, volume_24h: 800 },
];

describe('FiatConversionService', () => {
  let mockedAxios: jest.Mocked<typeof axios>;
  let service: typeof fiatConversionService;

  beforeEach(() => {
    // Reset the singleton's state before each test
    service = new (fiatConversionService as any).constructor();

    mockedAxios = axios as jest.Mocked<typeof axios>;
    mockedAxios.get.mockClear();
    (logger.info as jest.Mock).mockClear();
    (logger.error as jest.Mock).mockClear();
  });

  it('should not fetch rates on initialization', () => {
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('should fetch and cache rates on the first call', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockApiData });

    const rate = await service.getConversionRate('USD');

    expect(rate).toBe(50000.0);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith('Successfully updated fiat conversion rates.');
  });

  it('should use cache for subsequent calls within the cache duration', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockApiData });

    await service.getConversionRate('USD'); // First call
    const rate = await service.getConversionRate('USD'); // Second call

    expect(rate).toBe(50000.0);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Should not fetch again
  });

  it('should return null for an unsupported currency', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockApiData });

    const rate = await service.getConversionRate('JPY');
    expect(rate).toBeNull();
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('API Error'));

    const rate = await service.getConversionRate('USD');

    expect(rate).toBeNull();
    expect(logger.error).toHaveBeenCalledWith('Failed to update fiat conversion rates:', expect.any(Error));
  });

  it('should refetch data if cache is expired', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockApiData });

    // Initial fetch
    let rate = await service.getConversionRate('USD');
    expect(rate).toBe(50000.0);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    // Expire cache by manipulating time
    const CACHE_DURATION_MS = 15 * 60 * 1000;
    (service as any).cache['USD'].timestamp = Date.now() - CACHE_DURATION_MS - 1;

    // This call should trigger a refetch
    const updatedMockData = mockApiData.map(d => ({ ...d, last_trade_price: d.last_trade_price + 100 }));
    mockedAxios.get.mockResolvedValue({ data: updatedMockData });

    rate = await service.getConversionRate('USD');
    expect(rate).toBe(50100.0);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });
});
