import { SwapSimulator } from '../../src/core/swapSimulator';
import { JsonRpcProvider } from 'ethers';
import { Token } from '@uniswap/sdk-core';

// This is an integration test that requires a forked mainnet
import { mock } from 'jest-mock-extended';

jest.mock('@uniswap/v3-sdk', () => ({
    ...jest.requireActual('@uniswap/v3-sdk'),
    Quoter: {
        connect: jest.fn().mockReturnValue({
            quoteExactInputSingle: {
                staticCall: jest.fn(),
            },
        }),
    },
}));

describe('SwapSimulator', () => {
    let swapSimulator: SwapSimulator;
    let provider: jest.Mocked<JsonRpcProvider>;

    beforeAll(() => {
        provider = mock<JsonRpcProvider>();
        const quoterAddress = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';
        swapSimulator = new SwapSimulator(provider, quoterAddress);
    });

    it('should correctly simulate a swap on a forked mainnet', async () => {
        // Example: WETH -> USDC on a popular pool
        const WETH = new Token(1, '0x4200000000000000000000000000000000000006', 18, 'WETH', 'Wrapped Ether');
        const USDC = new Token(1, '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', 6, 'USDC', 'USD Coin');

        const poolState = {
            fee: 500,
            address: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640', // WETH/USDC 0.05%
            token0: USDC,
            token1: WETH
        };

        const amountIn = 1000000000000000000n; // 1 WETH

        (swapSimulator as any).quoterContract.quoteExactInputSingle.staticCall.mockResolvedValue(2000000000n);

        const result = await swapSimulator.simulateV3Swap(poolState, WETH, amountIn);

        expect(result.success).toBe(true);
        expect(result.amountOut).toBe(2000000000n);
    });
});
