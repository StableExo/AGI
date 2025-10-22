// gemini-citadel/src/havoc-core/core/tx/builders/AavePathBuilder.ts
import { ethers } from 'ethers';
import logger from '../../../../services/logger.service';

// --- Constants & Enums ---
enum DexType {
  UNISWAP_V3 = 0,
  SUSHISWAP = 1,
  DODO = 2,
}

// --- Interfaces for Type Safety ---
interface IToken {
  address: string;
  decimals: number;
  symbol: string;
}

interface IPathStep {
  address: string;
  tokenInAddress: string;
  tokenOutAddress: string;
  dex: string;
  fee?: number;
}

interface IAaveOpportunity {
  path: IPathStep[];
  tokenIn: IToken;
  amountIn: string;
}

interface ISimulationResult {
  finalAmount: string | null;
}

interface IBuilderConfig {
  SLIPPAGE_TOLERANCE_BPS: number;
}

interface ISwapStep {
  pool: string;
  tokenIn: string;
  tokenOut: string;
  fee: number;
  minOut: bigint;
  dexType: DexType;
}

interface IAaveParams {
  path: ISwapStep[];
  initiator: string;
  titheRecipient: string;
}

interface IBuilderOutput {
  params: IAaveParams;
  typeString: string;
  borrowTokenAddress: string;
  borrowAmount: bigint;
  contractFunctionName: string;
}

const logPrefix = '[AavePathBuilder]';

export class AavePathBuilder {
  private mapDexType(dexString: string): DexType {
    const lowerDex = dexString?.toLowerCase();
    switch (lowerDex) {
      case 'uniswapv3': return DexType.UNISWAP_V3;
      case 'sushiswap': return DexType.SUSHISWAP;
      case 'dodo': return DexType.DODO;
      default:
        throw new Error(`Unsupported DEX type for Aave path building: ${dexString}`);
    }
  }

  private calculateMinAmountOut(amountOut: bigint | null, slippageToleranceBps: number): bigint {
    if (amountOut === null || amountOut <= 0n) return 0n;
    if (typeof slippageToleranceBps !== 'number' || slippageToleranceBps < 0) slippageToleranceBps = 0;
    const BPS_DIVISOR = 10000n;
    const slippageFactor = BPS_DIVISOR - BigInt(Math.floor(slippageToleranceBps));
    if (slippageFactor < 0n) return 0n;
    return (amountOut * slippageFactor) / BPS_DIVISOR;
  }

  public buildParams(
    opportunity: IAaveOpportunity,
    simulationResult: ISimulationResult,
    config: IBuilderConfig,
    initiatorAddress: string,
    titheRecipient: string,
  ): IBuilderOutput {
    logger.debug(`${logPrefix} Building parameters...`);

    // --- Validations ---
    if (!opportunity?.path || opportunity.path.length === 0) throw new Error('Invalid or empty path in opportunity.');
    if (!opportunity.tokenIn?.address || !opportunity.amountIn) throw new Error('Missing borrow token or amountIn.');
    if (simulationResult?.finalAmount === null) throw new Error('Missing finalAmount in simulationResult.');
    if (config?.SLIPPAGE_TOLERANCE_BPS === undefined) throw new Error('Missing SLIPPAGE_TOLERANCE_BPS in config.');
    if (!ethers.isAddress(initiatorAddress)) throw new Error('Invalid initiator address.');
    if (!ethers.isAddress(titheRecipient)) throw new Error('Invalid titheRecipient address.');

    const borrowTokenAddress = opportunity.tokenIn.address;
    const borrowAmount = BigInt(opportunity.amountIn);
    const finalAmountSimulated = BigInt(simulationResult.finalAmount);
    const minAmountOutFinal = this.calculateMinAmountOut(finalAmountSimulated, config.SLIPPAGE_TOLERANCE_BPS);

    if (finalAmountSimulated > 0n && minAmountOutFinal <= 0n) {
      throw new Error('Calculated zero minimum final amount out from a positive simulation result.');
    }

    const swapStepArray: ISwapStep[] = opportunity.path.map((step, i) => {
      if (!step.address || !step.tokenInAddress || !step.tokenOutAddress || !step.dex) {
        throw new Error(`Invalid step structure at index ${i}.`);
      }

      const stepMinOut = (i === opportunity.path.length - 1) ? minAmountOutFinal : 0n;
      const dexType = this.mapDexType(step.dex);
      let feeUint24 = 0;

      if (dexType === DexType.UNISWAP_V3) {
        if (step.fee === undefined) throw new Error(`Missing required fee for Uniswap V3 step at index ${i}.`);
        feeUint24 = Number(step.fee);
        if (isNaN(feeUint24) || feeUint24 < 0 || feeUint24 > 16777215) {
          throw new Error(`Invalid V3 fee ${step.fee} for step ${i}.`);
        }
      }

      return {
        pool: step.address,
        tokenIn: step.tokenInAddress,
        tokenOut: step.tokenOutAddress,
        fee: feeUint24,
        minOut: stepMinOut,
        dexType: dexType,
      };
    });

    const params: IAaveParams = {
      path: swapStepArray,
      initiator: initiatorAddress,
      titheRecipient: titheRecipient,
    };

    const swapStepTypeString = "tuple(address pool, address tokenIn, address tokenOut, uint24 fee, uint256 minOut, uint8 dexType)";
    const typeString = `tuple(${swapStepTypeString}[] path, address initiator, address titheRecipient)`;

    logger.debug(`${logPrefix} Parameters built successfully for initiateAaveFlashLoan.`);
    return {
      params,
      typeString,
      borrowTokenAddress,
      borrowAmount,
      contractFunctionName: 'initiateAaveFlashLoan',
    };
  }
}
