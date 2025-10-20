import axios from 'axios';
import { MarketIntelligenceService, IGlobalMarketMetrics } from '../../src/services/MarketIntelligenceService';
import logger from '../../src/services/logger.service';

// Mock axios and logger
jest.mock('axios');
jest.mock('../../src/services/logger.service', () => ({
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('MarketIntelligenceService', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const mockedLogger = logger as jest.Mocked<typeof logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COINMARKETCAP_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.COINMARKETCAP_API_KEY;
  });

  it('should fetch and return global market metrics successfully', async () => {
    const marketIntelligenceService = new MarketIntelligenceService();
    const mockMetrics = {
      total_market_cap: 1.2e12,
      btc_dominance: 45.5,
      total_volume_24h: 1.5e11,
    };

    const mockResponse = {
      data: {
        data: {
          quote: {
            USD: mockMetrics,
          },
        },
      },
    };

    mockedAxios.get.mockResolvedValue(mockResponse);

    const result: IGlobalMarketMetrics | null = await marketIntelligenceService.getGlobalMarketMetrics();

    expect(result).toEqual({
      totalMarketCap: mockMetrics.total_market_cap,
      btcDominance: mockMetrics.btc_dominance,
      volume24h: mockMetrics.total_volume_24h,
    });
    expect(mockedAxios.get).toHaveBeenCalledWith('https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest', {
      headers: {
        'X-CMC_PRO_API_KEY': 'test-api-key',
      },
    });
  });

  it('should return null and log an error if the API call fails', async () => {
    const marketIntelligenceService = new MarketIntelligenceService();
    const mockError = new Error('API Error');
    mockedAxios.get.mockRejectedValue(mockError);

    const result = await marketIntelligenceService.getGlobalMarketMetrics();

    expect(result).toBeNull();
    expect(mockedLogger.error).toHaveBeenCalledWith('Error fetching global market metrics from CoinMarketCap:', mockError);
  });

  it('should return null if the API key is not provided', async () => {
    delete process.env.COINMARKETCAP_API_KEY;
    const marketIntelligenceService = new MarketIntelligenceService();
    const result = await marketIntelligenceService.getGlobalMarketMetrics();

    expect(result).toBeNull();
  });
});
