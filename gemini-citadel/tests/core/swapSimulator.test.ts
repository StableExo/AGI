import { SwapSimulator } from '../../src/core/swapSimulator';
import { JsonRpcProvider } from 'ethers';
import { Token } from '@uniswap/sdk-core';

// This is an integration test that requires a forked mainnet
import { mock } from 'jest-mock-extended';

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
        const WETH = new Token(1, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18, 'WETH', 'Wrapped Ether');
        const USDC = new Token(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD Coin');

        const poolState = {
            fee: 3000,
            address: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640', // WETH/USDC 0.3%
            token0: WETH,
            token1: USDC
        };

        const amountIn = 1000000000000000000n; // 1 WETH

        (swapSimulator as any).quoterContract.quoteExactInputSingle = {
            staticCall: jest.fn().mockResolvedValue(2000000000n)
        };

        const result = await swapSimulator.simulateV3Swap(poolState, WETH, amountIn);

        expect(result.success).toBe(true);
        expect(result.amountOut).toBe(2000000000n);
    });
});
