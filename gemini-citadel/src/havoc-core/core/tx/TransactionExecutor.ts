// gemini-citadel/src/havoc-core/core/tx/TransactionExecutor.ts
import { ethers, Provider, TransactionRequest, TransactionResponse, TransactionReceipt } from 'ethers';
import logger from '../../../services/logger.service';
import { TransactionEncoder } from './TransactionEncoder';
import { NonceManager } from '../../../utils/nonceManager';

// --- Interfaces for Dependencies ---

interface IExecutorConfig {
  TX_CONFIRMATIONS: number;
}

const logPrefix = '[TransactionExecutor]';

export class TransactionExecutor {
  private readonly config: IExecutorConfig;
  private readonly provider: Provider;
  private readonly signer: NonceManager;
  private readonly encoder: TransactionEncoder;

  constructor(config: IExecutorConfig, provider: Provider, signer: NonceManager) {
    logger.debug(`${logPrefix} Initializing...`);
    if (!config || !provider || !signer) {
      throw new Error('Config, Provider, and Signer are required for TxExecutor.');
    }
    this.config = config;
    this.provider = provider;
    this.signer = signer;
    this.encoder = new TransactionEncoder(); // Tightly coupled for now, can be injected later if needed.
    logger.info(`${logPrefix} Initialized with ${this.config.TX_CONFIRMATIONS} confirmations required.`);
  }

  private async handleDryRun(toAddress: string, calldata: string, gasLimit: bigint): Promise<void> {
    logger.info(`${logPrefix} DRY RUN mode enabled. Skipping transaction broadcast.`);
    const txDetails = {
      to: toAddress,
      data: calldata,
      gasLimit: gasLimit.toString(),
      from: this.signer.address,
    };
    logger.debug(`${logPrefix} Dry Run Tx Details:`, txDetails);
  }

  private buildTransaction(toAddress: string, calldata: string, gasLimit: bigint, feeData: any): TransactionRequest {
    const tx: TransactionRequest = {
      to: toAddress,
      data: calldata,
      gasLimit: gasLimit,
      ...(feeData.maxFeePerGas && feeData.maxPriorityFeePerGas
        ? { maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas }
        : { gasPrice: feeData.gasPrice }),
    };
    return tx;
  }

  private async sendAndWait(tx: TransactionRequest): Promise<{ response: TransactionResponse; receipt: TransactionReceipt | null }> {
    logger.info(`${logPrefix} Broadcasting transaction...`);
    const response = await this.signer.sendTransaction(tx);
    logger.info(`${logPrefix} Transaction sent! Hash: ${response.hash}, Nonce: ${response.nonce}`);

    logger.info(`${logPrefix} Waiting for ${this.config.TX_CONFIRMATIONS} confirmation(s)...`);
    const receipt = await response.wait(this.config.TX_CONFIRMATIONS);
    return { response, receipt };
  }

  private async handleOutcome(receipt: TransactionReceipt | null, response: TransactionResponse): Promise<{ success: boolean; txHash: string | undefined; receipt: TransactionReceipt | null }> {
    if (receipt?.status === 1) {
      logger.info(`${logPrefix} Transaction successful! Hash: ${receipt.hash}, Block: ${receipt.blockNumber}, Gas Used: ${receipt.gasUsed.toString()}`);
      return { success: true, txHash: receipt.hash, receipt };
    } else {
      const errorMessage = `Transaction failed or reverted. Hash: ${receipt?.hash}`;
      logger.error(`${logPrefix} ${errorMessage}`);
      // Ethers v6 automatically includes revert reason in the error when a call fails,
      // so manual decoding is less necessary. We re-throw for the caller to handle.
      throw new Error(errorMessage);
    }
  }

  public async executeTransaction(
    toAddress: string,
    functionName: string,
    functionArgs: any[],
    estimatedGasLimit: bigint,
    feeData: any, // Ethers FeeData
    opportunityDetails: string = "Opportunity",
    isDryRun: boolean = false
  ): Promise<{ success: boolean; txHash?: string; receipt?: TransactionReceipt | null }> {
    const contextPrefix = `[TxExecutor ${opportunityDetails}]`;
    logger.info(`${contextPrefix} Preparing transaction...`);

    try {
      const calldata = this.encoder.encodeFlashSwapCall(functionName, functionArgs);

      if (!ethers.isAddress(toAddress) || !estimatedGasLimit || estimatedGasLimit <= 0n || !feeData) {
        throw new Error('Invalid input for transaction execution.');
      }

      if (isDryRun) {
        await this.handleDryRun(toAddress, calldata, estimatedGasLimit);
        return { success: true, txHash: 'DRY_RUN' };
      }

      const tx = this.buildTransaction(toAddress, calldata, estimatedGasLimit, feeData);
      const { response, receipt } = await this.sendAndWait(tx);
      return await this.handleOutcome(receipt, response);

    } catch (error: any) {
      logger.error(`${contextPrefix} Transaction execution failed: ${error.message}`, { error });
      throw error; // Re-throw for the service layer to catch and handle.
    }
  }
}
