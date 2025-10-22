// gemini-citadel/src/havoc-core/core/tx/builders/TwoHopV3PathBuilder.ts
import { ethers } from 'ethers';
import logger from '../../../../services/logger.service';

// --- Interfaces for Type Safety ---

interface IToken {
  address: string;
}

interface IPathLeg {
  dex: 'uniswapV3';
  fee: number;
}

interface ISpatialOpportunity {
  type: 'spatial';
  path: IPathLeg[];
  tokenIn: IToken;
  tokenIntermediate: IToken;
}

interface ISimulationResult {
  initialAmount: bigint;
  hop1AmountOutSimulated: bigint;
  finalAmountSimulated: bigint;
}

interface IBuilderConfig {
  SLIPPAGE_TOLERANCE_BPS: number;
}

interface ITwoHopParams {
  tokenIntermediate: string;
  feeA: number;
  feeB: number;
  amountOutMinimum1: bigint;
  amountOutMinimum2: bigint;
  titheRecipient: string;
}

interface IBuilderOutput {
  params: ITwoHopParams;
  borrowTokenAddress: string;
  borrowAmount: bigint;
  typeString: string;
  contractFunctionName: string;
}

const logPrefix = '[TwoHopV3PathBuilder]';

export class TwoHopV3PathBuilder {
  /**
   * Calculates the minimum amount out based on slippage tolerance.
   */
  private calculateMinAmountOut(amountOut: bigint | null, slippageToleranceBps: number): bigint {
    if (amountOut === null || amountOut <= 0n) {
      return 0n;
    }
    if (typeof slippageToleranceBps !== 'number' || slippageToleranceBps < 0) {
      slippageToleranceBps = 0;
    }
    const BPS_DIVISOR = 10000n;
    const slippageFactor = BPS_DIVISOR - BigInt(Math.floor(slippageToleranceBps));
    if (slippageFactor < 0n) return 0n;
    return (amountOut * slippageFactor) / BPS_DIVISOR;
  }

  /**
   * Builds parameters for the initiateUniswapV3FlashLoan function.
   */
  public buildParams(
    opportunity: ISpatialOpportunity,
    simulationResult: ISimulationResult,
    config: IBuilderConfig,
    titheRecipient: string,
  ): IBuilderOutput {
    logger.debug(`${logPrefix} Building parameters...`);

    // --- Validations ---
    if (opportunity?.type !== 'spatial' || opportunity.path?.length !== 2 || opportunity.path[0].dex !== 'uniswapV3' || opportunity.path[1].dex !== 'uniswapV3') {
      throw new Error('Invalid spatial opportunity for V3->V3 param build.');
    }
    if (!opportunity.tokenIn || !opportunity.tokenIntermediate) {
      throw new Error('Missing tokenIn or tokenIntermediate in V3->V3 opportunity.');
    }
    if (!simulationResult || typeof simulationResult.initialAmount !== 'bigint' || typeof simulationResult.hop1AmountOutSimulated !== 'bigint' || typeof simulationResult.finalAmountSimulated !== 'bigint') {
      throw new Error('Invalid simulationResult structure for V3->V3 param build.');
    }
    if (!ethers.isAddress(titheRecipient)) {
      throw new Error(`Invalid titheRecipient address provided: "${titheRecipient}"`);
    }

    const [leg1, leg2] = opportunity.path;
    const feeA = Number(leg1.fee);
    const feeB = Number(leg2.fee);

    if (isNaN(feeA) || isNaN(feeB) || feeA < 0 || feeB < 0) {
      throw new Error(`Invalid V3 fees found: feeA=${feeA}, feeB=${feeB}`);
    }

    const borrowAmount = simulationResult.initialAmount;
    const isMinimalGasEstimateSim =
      simulationResult.initialAmount === 1n &&
      simulationResult.hop1AmountOutSimulated === 1n &&
      simulationResult.finalAmountSimulated === 1n;

    let minAmountOut1: bigint;
    let minAmountOut2: bigint;

    if (isMinimalGasEstimateSim) {
      minAmountOut1 = this.calculateMinAmountOut(simulationResult.hop1AmountOutSimulated, 0);
      minAmountOut2 = this.calculateMinAmountOut(simulationResult.finalAmountSimulated, 0);
    } else {
      minAmountOut1 = this.calculateMinAmountOut(simulationResult.hop1AmountOutSimulated, config.SLIPPAGE_TOLERANCE_BPS);
      minAmountOut2 = this.calculateMinAmountOut(simulationResult.finalAmountSimulated, config.SLIPPAGE_TOLERANCE_BPS);

      if (minAmountOut1 <= 0n || minAmountOut2 <= 0n) {
        throw new Error('Calculated zero minimum amount out from simulation for execution.');
      }
    }

    const params: ITwoHopParams = {
      tokenIntermediate: opportunity.tokenIntermediate.address,
      feeA: feeA,
      feeB: feeB,
      amountOutMinimum1: minAmountOut1,
      amountOutMinimum2: minAmountOut2,
      titheRecipient: titheRecipient,
    };

    const typeString = "tuple(address tokenIntermediate, uint24 feeA, uint24 feeB, uint256 amountOutMinimum1, uint256 amountOutMinimum2, address titheRecipient)";
    const contractFunctionName = 'initiateUniswapV3FlashLoan';

    logger.debug(`${logPrefix} Parameters built successfully.`);
    return {
      params,
      borrowTokenAddress: opportunity.tokenIn.address,
      borrowAmount,
      typeString,
      contractFunctionName,
    };
  }
}
