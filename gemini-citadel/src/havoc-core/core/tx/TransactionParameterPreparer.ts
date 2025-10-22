// gemini-citadel/src/havoc-core/core/tx/TransactionParameterPreparer.ts
import { AbiCoder, Wallet } from 'ethers';
import { ParameterBuilderFactory } from './ParameterBuilderFactory';
import logger from '../../../../services/logger.service';

// --- Enums and Interfaces ---

enum CallbackType {
  TwoHopV3 = 0,
  Triangular = 1,
  // Add other types as needed
}

export interface IExecutionParameters {
  contractFunctionName: string;
  flashLoanArgs: any[];
  gasLimit: bigint;
}

const logPrefix = '[TxParamPreparer]';

export class TransactionParameterPreparer {
  private readonly parameterBuilderFactory: ParameterBuilderFactory;
  private readonly abiCoder: AbiCoder;

  constructor() {
    this.parameterBuilderFactory = new ParameterBuilderFactory();
    this.abiCoder = AbiCoder.defaultAbiCoder();
    logger.debug(`${logPrefix} Initialized.`);
  }

  public prepare(
    tradeToExecute: any,
    config: any,
    initiatorAddress: string,
    titheRecipient: string
  ): IExecutionParameters {
    logger.debug(`${logPrefix} Preparing execution parameters...`);

    if (!tradeToExecute?.path?.length) {
      throw new Error('Trade object missing valid path information.');
    }
    if (!tradeToExecute.gasEstimate?.pathGasLimit) {
        throw new Error('Trade object missing required gas estimate.');
    }

    const providerType = tradeToExecute.path[0].dex === 'uniswapV3' ? 'UNIV3' : 'AAVE';
    logger.debug(`${logPrefix} Determined provider type: ${providerType}`);

    const simResultForBuilder = {
        initialAmount: BigInt(tradeToExecute.amountIn || '0'),
        hop1AmountOutSimulated: BigInt(tradeToExecute.intermediateAmountOut || '0'), // For TwoHop
        finalAmount: BigInt(tradeToExecute.amountOut || '0'),
        finalAmountSimulated: BigInt(tradeToExecute.amountOut || '0'), // For TwoHop
    };

    const builder = this.parameterBuilderFactory.getBuilder(tradeToExecute);
    const buildResult = builder.buildParams(tradeToExecute, simResultForBuilder, config, initiatorAddress, titheRecipient);

    let flashLoanArgs: any[];
    const { contractFunctionName, borrowTokenAddress, borrowAmount, typeString, params } = buildResult;

    if (providerType === 'UNIV3') {
        const encodedParamsBytes = this.abiCoder.encode([typeString], [params]);
        const borrowPoolState = tradeToExecute.path[0].poolState;

        let amount0ToBorrow = 0n;
        let amount1ToBorrow = 0n;
        if (borrowTokenAddress.toLowerCase() === borrowPoolState.token0.address.toLowerCase()) {
            amount0ToBorrow = borrowAmount;
        } else {
            amount1ToBorrow = borrowAmount;
        }

        const dexPath = tradeToExecute.path.map((p: any) => p.dex).join('->');
        let callbackType: CallbackType;
        if (tradeToExecute.type === 'spatial' && dexPath === 'uniswapV3->uniswapV3') {
            callbackType = CallbackType.TwoHopV3;
        } else if (tradeToExecute.type === 'triangular') {
            callbackType = CallbackType.Triangular;
        } else {
            throw new Error(`Cannot map UniV3 trade type to CallbackType enum.`);
        }

        flashLoanArgs = [
            callbackType,
            borrowPoolState.address,
            amount0ToBorrow,
            amount1ToBorrow,
            encodedParamsBytes
        ];

    } else { // AAVE
        const encodedArbParamsBytes = this.abiCoder.encode([typeString], [params]);
        flashLoanArgs = [
            [borrowTokenAddress],
            [borrowAmount],
            encodedArbParamsBytes
        ];
    }

    const gasLimit = BigInt(tradeToExecute.gasEstimate.pathGasLimit);
    if (gasLimit <= 0n) {
        throw new Error(`Invalid gas limit determined (${gasLimit.toString()})`);
    }

    logger.debug(`${logPrefix} Parameter preparation successful.`);
    return {
        contractFunctionName,
        flashLoanArgs,
        gasLimit
    };
  }
}
