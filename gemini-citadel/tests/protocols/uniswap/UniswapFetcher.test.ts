import { UniswapFetcher } from '../../../src/protocols/uniswap/UniswapFetcher';
import { providers } from 'ethers-v5';
import { Contract } from 'ethers-v5';

// Mock the ethers-v5 modules
jest.mock('ethers-v5', () => {
    const originalEthers = jest.requireActual('ethers-v5');
    return {
        ...originalEthers,
        Contract: jest.fn(),
        providers: {
            JsonRpcProvider: jest.fn(),
        },
    };
});


describe('UniswapFetcher', () => {
    let fetcher: UniswapFetcher;
    let mockContract: jest.Mocked<Contract>;

    beforeEach(() => {
        // Set up the environment variable
        process.env.RPC_URL = 'http://localhost:8545';

        // Mock the contract methods
        mockContract = {
            slot0: jest.fn().mockResolvedValue({
                sqrtPriceX96: '41451787330247755824058435834239220',
                tick: 263367,
            }),
            liquidity: jest.fn().mockResolvedValue('1337'),
        } as any;

        // Configure the Contract mock to return our mock instance
        (Contract as unknown as jest.Mock).mockImplementation(() => mockContract);

        // Instantiate the fetcher
        fetcher = new UniswapFetcher();
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete process.env.RPC_URL;
    });

    it('should fetch the price for a supported pair', async () => {
        const price = await fetcher.fetchPrice('WBTC/WETH');

        // Assertions
        expect(price).toBeCloseTo(27.3733, 4);
        expect(mockContract.slot0).toHaveBeenCalledTimes(1);
        expect(mockContract.liquidity).toHaveBeenCalledTimes(1);
    });

    it('should throw an error for an unsupported pair', async () => {
        await expect(fetcher.fetchPrice('UNSUPPORTED/PAIR')).rejects.toThrow(
            'Unsupported pair for Uniswap: UNSUPPORTED/PAIR'
        );
    });

    it('should throw an error if RPC_URL is not set', () => {
        delete process.env.RPC_URL;
        expect(() => new UniswapFetcher()).toThrow('RPC_URL environment variable is not set.');
    });
});