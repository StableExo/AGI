import axios from 'axios';
import { FiatConversionService } from '../../src/services/FiatConversionService';
import { fiatConfig } from '../../src/config/fiat.config';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock logger to prevent console output during tests
jest.mock('../../src/services/logger.service', () => ({
  __esModule: true, // This is important for mocking default exports
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockApiResponse = {
  USD: { last: 60000.0, symbol: '$' },
  EUR: { last: 50000.0, symbol: '€' },
  JPY: { last: 6500000.0, symbol: '¥' },
};

describe('FiatConversionService', () => {
  let fiatConversionService: FiatConversionService;

  beforeEach(() => {
    fiatConversionService = new FiatConversionService();
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  it('should fetch exchange rates and return fiat conversions', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

    const profit = 100; // 100 USDT
    const conversion = await fiatConversionService.getFiatConversion(profit, 'USD');

    expect(conversion).toBe(' (~100.00 USD, 83.33 EUR, 10833.33 JPY)');
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('should use cached exchange rates on subsequent calls', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

    // First call - fetches from API
    await fiatConversionService.getFiatConversion(100, 'USD');
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    // Second call - should use cache
    const conversion = await fiatConversionService.getFiatConversion(50, 'USD');
    expect(conversion).toBe(' (~50.00 USD, 41.67 EUR, 5416.67 JPY)');
    expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Should not be called again
  });

  it('should refetch rates after cache expires', async () => {
    const originalNow = Date.now;
    Date.now = jest.fn()
      .mockReturnValueOnce(0) // First call
      .mockReturnValueOnce(16 * 60 * 1000); // Second call, after 16 mins

    mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

    await fiatConversionService.getFiatConversion(100, 'USD');
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    await fiatConversionService.getFiatConversion(100, 'USD');
    expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Should be called again

    Date.now = originalNow; // Restore original Date.now
  });

  it('should return unavailable message when API call fails', async () => {
    mockedAxios.get.mockRejectedValue(new Error('API Error'));

    const conversion = await fiatConversionService.getFiatConversion(100, 'USD');
    expect(conversion).toBe(' (Fiat conversion unavailable)');
  });

  it('should handle missing source currency gracefully', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

    const conversion = await fiatConversionService.getFiatConversion(100, 'CAD'); // CAD not in mock response
    expect(conversion).toBe(' (Fiat conversion unavailable)');
  });

  it('should handle missing target currencies gracefully', async () => {
    // Modify config for this test
    fiatConfig.targetCurrencies.push('GBP');
    mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

    const conversion = await fiatConversionService.getFiatConversion(100, 'USD');
    // Should still return the valid ones
    expect(conversion).toBe(' (~100.00 USD, 83.33 EUR, 10833.33 JPY)');

    // Reset config
    fiatConfig.targetCurrencies.pop();
  });
});
