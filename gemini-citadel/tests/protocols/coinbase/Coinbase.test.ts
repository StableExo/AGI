import { CoinbaseFetcher } from '../../../src/protocols/coinbase/CoinbaseFetcher';
import { CoinbaseExecutor } from '../../../src/protocols/coinbase/CoinbaseExecutor';
import { ITradeAction } from '../../../src/interfaces/ITradeAction';
import axios from 'axios';

// Mock axios to avoid actual API calls
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CoinbaseFetcher', () => {
    let fetcher: CoinbaseFetcher;

    beforeEach(() => {
        fetcher = new CoinbaseFetcher();
        mockedAxios.get.mockClear();
    });

    it('should fetch the price for a valid pair', async () => {
        const mockResponse = { data: { price: '50000.00' } };
        mockedAxios.get.mockResolvedValue(mockResponse);

        const price = await fetcher.fetchPrice('BTC-USD');

        expect(price).toBe(50000.00);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'https://api.coinbase.com/api/v3/brokerage/products/BTC-USD',
            { params: {} }
        );
    });

    it('should throw an error for an invalid pair format', async () => {
        await expect(fetcher.fetchPrice('BTCUSD')).rejects.toThrow(
            "Invalid pair format for Coinbase: BTCUSD. Expected format like 'BTC-USD'."
        );
    });

    it('should throw an error if the API response is malformed', async () => {
        const mockResponse = { data: { value: '50000.00' } }; // 'value' instead of 'price'
        mockedAxios.get.mockResolvedValue(mockResponse);

        await expect(fetcher.fetchPrice('BTC-USD')).rejects.toThrow(
            'Unexpected response structure for BTC-USD.'
        );
    });
});

describe('CoinbaseExecutor', () => {
    let executor: CoinbaseExecutor;

    const mockAction: ITradeAction = {
        exchange: 'coinbase',
        pair: 'BTC-USD',
        action: 'Buy',
        price: 50000,
        amount: 0.1,
    };

    beforeEach(() => {
        // Set up mock environment variables
        process.env.COINBASE_API_KEY = 'test-key';
        process.env.COINBASE_API_SECRET = 'test-secret';
        process.env.EXECUTION_MODE = 'DRY_RUN'; // Default to DRY_RUN for safety

        executor = new CoinbaseExecutor();
        // Correctly clear the mock for the main axios function
        (axios as unknown as jest.Mock).mockClear();
    });

    it('should correctly log a DRY_RUN order', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        const receipt = await executor.placeOrder(mockAction);

        expect(receipt.success).toBe(true);
        expect(receipt.orderId).toContain('dry-run-');
        expect(consoleSpy).toHaveBeenCalledWith('[CoinbaseExecutor][DRY_RUN] Would place the following order:');

        consoleSpy.mockRestore();
    });

    it('should execute a LIVE order', async () => {
        process.env.EXECUTION_MODE = 'LIVE';
        executor = new CoinbaseExecutor(); // Re-initialize to pick up new EXECUTION_MODE

        const mockApiResponse = {
            data: {
                success: true,
                order_id: 'live-order-123',
                filled_size: '0.1',
            }
        };
        (axios as unknown as jest.Mock).mockResolvedValue(mockApiResponse);

        const receipt = await executor.placeOrder(mockAction);

        expect(receipt.success).toBe(true);
        expect(receipt.orderId).toBe('live-order-123');
        expect(receipt.filledAmount).toBe(0.1);
        expect(axios).toHaveBeenCalledTimes(1);
        const axiosCall = (axios as unknown as jest.Mock).mock.calls[0][0];
        expect(axiosCall.method).toBe('POST');
        expect(axiosCall.url).toContain('/orders');
        expect(axiosCall.headers).toHaveProperty('CB-ACCESS-KEY', 'test-key');
        expect(axiosCall.headers).toHaveProperty('CB-ACCESS-SIGN');
    });

    it('should throw an error if API keys are missing', () => {
        delete process.env.COINBASE_API_KEY;
        delete process.env.COINBASE_API_SECRET;

        expect(() => new CoinbaseExecutor()).toThrow('Coinbase API key and secret must be provided in environment variables.');
    });
});