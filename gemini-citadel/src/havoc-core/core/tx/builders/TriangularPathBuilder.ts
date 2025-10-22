// gemini-citadel/src/havoc-core/core/tx/builders/TriangularPathBuilder.ts
import { ethers } from 'ethers';
import logger from '../../../../services/logger.service';

// --- Interfaces for Type Safety ---

interface IToken {
  address: string;
  decimals: number;
}

interface IPool {
  fee: number;
}

interface ITriangularOpportunity {
  type: 'triangular';
  pools: IPool[];
  pathSymbols: string[];
  tokenA: IToken;
  tokenB: IToken;
  tokenC: IToken;
}

interface ISimulationResult {
  initialAmount: bigint | null;
  finalAmount: bigint | null;
}

interface IBuilderConfig {
  SLIPPAGE_TOLERANCE_BPS: number;
}

interface ITriangularParams {
  tokenA: string;
  tokenB: string;
  tokenC: string;
  fee1: number;
  fee2: number;
  fee3: number;
  amountOutMinimumFinal: bigint;
  titheRecipient: string;
}

interface IBuilderOutput {
  params: ITriangularParams;
  borrowTokenAddress: string;
  borrowAmount: bigint;
  typeString: string;
  contractFunctionName: string;
}

const logPrefix = '[TriangularPathBuilder]';

export class TriangularPathBuilder {
  /**
   * Calculates the minimum amount out based on slippage tolerance.
   */
  private calculateMinAmountOut(amountOut: bigint | null, slippageToleranceBps: number): bigint {
    if (amountOut === null || amountOut <= 0n) {
      logger.warn(`${logPrefix} [calculateMinAmountOut] Invalid input amount. Returning 0n.`);
      return 0n;
    }
    if (typeof slippageToleranceBps !== 'number' || slippageToleranceBps < 0) {
      logger.warn(`${logPrefix} [calculateMinAmountOut] Invalid slippage. Using 0 BPS.`);
      slippageToleranceBps = 0;
    }

    const BPS_DIVISOR = 10000n;
    const slippageFactor = BPS_DIVISOR - BigInt(Math.floor(slippageToleranceBps));
    if (slippageFactor < 0n) return 0n;

    return (amountOut * slippageFactor) / BPS_DIVISOR;
  }

  /**
   * Builds parameters for the initiateTriangularFlashSwap function.
   */
  public buildParams(
    opportunity: ITriangularOpportunity,
    simulationResult: ISimulationResult,
    config: IBuilderConfig,
    titheRecipient: string,
  ): IBuilderOutput {
    logger.debug(`${logPrefix} Building parameters...`);

    if (
      !opportunity || opportunity.type !== 'triangular' || !opportunity.pools ||
      opportunity.pools.length !== 3 || !opportunity.tokenA || !opportunity.tokenB || !opportunity.tokenC
    ) {
      throw new Error('Invalid triangular opportunity structure.');
    }
    if (simulationResult.initialAmount === null || simulationResult.finalAmount === null) {
      throw new Error('Invalid simulationResult amounts.');
    }
    if (!ethers.isAddress(titheRecipient)) {
      throw new Error('Invalid titheRecipient address provided.');
    }

    const [poolAB, poolBC, poolCA] = opportunity.pools;
    if (poolAB?.fee === undefined || poolBC?.fee === undefined || poolCA?.fee === undefined) {
      throw new Error('Missing required fee in triangular opportunity pools.');
    }

    const borrowTokenAddress = opportunity.tokenA.address;
    const borrowAmount = simulationResult.initialAmount;
    const minAmountOutFinal = this.calculateMinAmountOut(simulationResult.finalAmount, config.SLIPPAGE_TOLERANCE_BPS);

    if (minAmountOutFinal <= 0n) {
      throw new Error('Calculated zero minimum final amount out.');
    }

    const params: ITriangularParams = {
      tokenA: opportunity.tokenA.address,
      tokenB: opportunity.tokenB.address,
      tokenC: opportunity.tokenC.address,
      fee1: Number(poolAB.fee),
      fee2: Number(poolBC.fee),
      fee3: Number(poolCA.fee),
      amountOutMinimumFinal: minAmountOutFinal,
      titheRecipient: titheRecipient,
    };

    const typeString = "tuple(address tokenA, address tokenB, address tokenC, uint24 fee1, uint24 fee2, uint24 fee3, uint256 amountOutMinimumFinal, address titheRecipient)";
    const contractFunctionName = 'initiateTriangularFlashSwap';

    logger.debug(`${logPrefix} Parameters built successfully.`);
    return { params, borrowTokenAddress, borrowAmount, typeString, contractFunctionName };
  }
}
