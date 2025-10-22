import { ethers, Provider } from 'ethers';
import logger from '../services/logger.service';
import { IQuoterV2 } from '../../typechain-types';
import IQuoterV2ABI from '../../artifacts/contracts/interfaces/IQuoterV2.sol/IQuoterV2.json';
import { Token } from '@uniswap/sdk-core';

export class SwapSimulator {
    private provider: Provider;
    private quoterContract: IQuoterV2;

    constructor(provider: Provider, quoterAddress: string) {
        this.provider = provider;
        this.quoterContract = new ethers.Contract(quoterAddress, IQuoterV2ABI.abi, this.provider) as any;
        logger.info(`[SwapSimulator] Initialized with Quoter V2 at ${quoterAddress}`);
    }

    public async simulateV3Swap(poolState: any, tokenIn: Token, amountIn: bigint): Promise<{ success: boolean, amountOut: bigint | null, gasEstimate: bigint | null, error: string | null }> {
        const { fee, token0, token1, address } = poolState;
        const logPrefix = `[SwapSim V3 ${address?.substring(0,6)}]`;

        const tokenOut = tokenIn.address.toLowerCase() === token0.address.toLowerCase() ? token1 : token0;
        if (!tokenOut) {
             logger.warn(`${logPrefix} Cannot determine tokenOut from pair.`);
             return { success: false, amountOut: null, gasEstimate: null, error: 'Cannot determine tokenOut' };
        }

        const params = {
             tokenIn: tokenIn.address,
             tokenOut: tokenOut.address,
             fee: Number(fee),
             amountIn: amountIn,
             sqrtPriceLimitX96: 0n
        };

        try {
            logger.debug(`${logPrefix} Quoting ${tokenIn.symbol}->${tokenOut.symbol} Fee ${params.fee} In ${amountIn.toString()} (raw)`);
            const quoteResult = await this.quoterContract.quoteExactInputSingle.staticCall(
                params.tokenIn,
                params.tokenOut,
                params.fee,
                params.amountIn,
                params.sqrtPriceLimitX96
            );

            const amountOut = BigInt(quoteResult[0]);
            const gasEstimate = BigInt(quoteResult[3]);

            logger.debug(`${logPrefix} Quoter Out: ${amountOut.toString()} (raw), Gas Estimate: ${gasEstimate.toString()}`);

            if (amountOut <= 0n) {
                logger.debug(`${logPrefix} Quoter zero or negative output (${amountOut}).`);
                return { success: false, amountOut: 0n, gasEstimate: null, error: 'Quoter zero output' };
            }

            return { success: true, amountOut: amountOut, gasEstimate: gasEstimate, error: null };

        } catch (error: any) {
            let reason = error.reason || error.message;
            if (error.data && typeof error.data === 'string' && error.data !== '0x') {
                 try { reason = ethers.toUtf8String(error.data); } catch {}
            }
            logger.warn(`${logPrefix} Quoter fail: ${reason}`);
            return { success: false, amountOut: null, gasEstimate: null, error: `Quoter fail: ${reason}` };
        }
    }
}
