// src/services/TransactionService.ts
import { Wallet, Provider, ethers } from 'ethers';
import { TransactionParameterPreparer } from '../havoc-core/core/tx/TransactionParameterPreparer';
import { TransactionExecutor } from '../havoc-core/core/tx/TransactionExecutor';
import { ArbitrageOpportunity } from '../models/ArbitrageOpportunity';
import logger from './logger.service';
import { botConfig } from '../config/bot.config';

const logPrefix = '[TransactionService]';

export class TransactionService {
  private readonly preparer: TransactionParameterPreparer;
  private readonly executor: TransactionExecutor;
  private readonly signer: Wallet;
  private readonly provider: Provider;
  private readonly config: any; // Simplified config type

  constructor(provider: Provider, signer: Wallet) {
    logger.info(`${logPrefix} Initializing...`);
    this.provider = provider;
    this.signer = signer;

    // A simplified config for the executor
    this.config = {
      TX_CONFIRMATIONS: 1,
    };

    this.preparer = new TransactionParameterPreparer();
    this.executor = new TransactionExecutor(this.config, this.provider, this.signer);
    logger.info(`${logPrefix} Initialized successfully.`);
  }

  /**
   * Takes a trade opportunity, prepares it, and executes it on-chain.
   * Adheres to the EXECUTION_MODE safety protocol.
   * @param opportunity The arbitrage opportunity to execute.
   */
  public async executeTrade(opportunity: ArbitrageOpportunity): Promise<{ success: boolean; txHash?: string; }> {
    logger.info(`${logPrefix} Received trade for execution. Profit: ${opportunity.profit}`);

    try {
      const isDryRun = process.env.EXECUTION_MODE === 'DRY_RUN';
      const titheRecipient = process.env.TITHE_RECIPIENT_ADDRESS || this.signer.address; // Default to self
      const flashSwapAddress = process.env.FLASH_SWAP_CONTRACT_ADDRESS!;

      if (!flashSwapAddress) {
          throw new Error("FLASH_SWAP_CONTRACT_ADDRESS is not set in the environment.");
      }

      // 1. Prepare Transaction Parameters
      const executionParams = this.preparer.prepare(
        opportunity,
        botConfig, // Pass the global bot config
        this.signer.address,
        titheRecipient
      );

      // 2. Fetch Fee Data
      const feeData = await this.provider.getFeeData();

      // 3. Execute Transaction
      const result = await this.executor.executeTransaction(
        flashSwapAddress,
        executionParams.contractFunctionName,
        executionParams.flashLoanArgs,
        executionParams.gasLimit,
        feeData,
        `Profit: ${opportunity.profit}`,
        isDryRun
      );

      if (result.success) {
        logger.info(`${logPrefix} Execution successful. TxHash: ${result.txHash}`);
      } else {
        logger.error(`${logPrefix} Execution failed.`, { txHash: result.txHash });
      }

      return { success: result.success, txHash: result.txHash };

    } catch (error: any) {
      logger.error(`${logPrefix} An error occurred during trade execution: ${error.message}`, { error });
      return { success: false };
    }
  }
}
