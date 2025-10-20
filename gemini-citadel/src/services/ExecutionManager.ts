import { AbiCoder, Wallet } from 'ethers';
import { ArbitrageOpportunity } from '../models/ArbitrageOpportunity';
import { FlashbotsService, FlashbotsTransaction } from './FlashbotsService';
import logger from './logger.service';
import { ExchangeDataProvider } from './ExchangeDataProvider';
import { ITradeAction } from '../models/ITradeAction';
import { UniversalRouterEncoder } from './UniversalRouterEncoder.service';
import { FlashSwap__factory } from '../../typechain-types';

export class ExecutionManager {
  private flashbotsService: FlashbotsService;
  private executionSigner: Wallet;
  private exchangeDataProvider: ExchangeDataProvider;
  private routerEncoder: UniversalRouterEncoder;

  constructor(
    flashbotsService: FlashbotsService,
    executionSigner: Wallet,
    exchangeDataProvider: ExchangeDataProvider,
  ) {
    this.flashbotsService = flashbotsService;
    this.executionSigner = executionSigner;
    this.exchangeDataProvider = exchangeDataProvider;
    this.routerEncoder = new UniversalRouterEncoder();
    logger.info(`[ExecutionManager] Initialized.`);
  }

  public async executeCexTrade(opportunity: ArbitrageOpportunity): Promise<void> {
    logger.info(
      `[ExecutionManager] Executing CEX opportunity with profit: ${opportunity.profit}`,
    );

    const results = await Promise.all(
      opportunity.tradeActions.map(async (action: ITradeAction) => {
        const executor = this.exchangeDataProvider.getExecutor(action.exchange);
        if (!executor) {
          const message = `Could not find executor for exchange: ${action.exchange}`;
          logger.error(message);
          return { success: false, message };
        }
        try {
          const receipt = await executor.placeOrder(action);
          if (receipt.success) {
            logger.info(`Placed order on ${action.exchange}: ${receipt.orderId}`);
          } else {
            logger.error(`Failed to place order on ${action.exchange}: ${receipt.message}`);
          }
          return receipt;
        } catch (error: any) {
          const message = `Exception executing order on ${action.exchange}: ${error.message}`;
          logger.error(message, error);
          return { success: false, message };
        }
      }),
    );

    if (results.every(r => r.success)) {
      logger.info(
        `[ExecutionManager] Successfully executed CEX opportunity. Order IDs: ${results
          .map(r => r.orderId)
          .join(', ')}`,
      );
    } else {
      logger.error('[ExecutionManager] One or more orders failed to execute.');
    }
  }

  /**
   * Executes a DEX arbitrage opportunity by encoding it for the FlashSwap contract
   * and submitting it as a bundle to Flashbots.
   * @param opportunity - The arbitrage opportunity, enriched with on-chain data.
   * @param flashSwapContractAddress - The address of the deployed FlashSwap contract.
   * @returns A promise that resolves with a boolean indicating if the bundle was included.
   */
  public async executeTrade(
    opportunity: ArbitrageOpportunity,
    flashSwapContractAddress: string,
  ): Promise<boolean> {
    logger.info(
      `[ExecutionManager] Attempting to execute DEX opportunity with profit: ${opportunity.profit}`,
    );

    if (!opportunity.tradeActions || opportunity.tradeActions.length === 0) {
      logger.warn('[ExecutionManager] Opportunity has no trade actions. Aborting.');
      return false;
    }

    const commands: number[] = [];
    const inputs: string[] = [];

    // Assume the sequence of trade actions is the desired path
    for (const action of opportunity.tradeActions) {
      // For now, we only support V3_SWAP_EXACT_IN
      if (!action.tokenIn || !action.tokenOut || action.poolFee === undefined) {
        throw new Error('TradeAction is missing required on-chain parameters for a V3 swap.');
      }

      // The path for a single-hop V3 swap is [tokenIn, fee, tokenOut]
      const path = [action.tokenIn, action.poolFee, action.tokenOut];

      const encoded = this.routerEncoder.encodeV3SwapExactIn(
        flashSwapContractAddress, // Recipient is the contract itself
        action.amount, // amountIn
        BigInt(0), // amountOutMinimum - TODO: Calculate this properly based on slippage
        path,
        false, // payerIsUser - funds are already in the contract from the loan
      );

      commands.push(encoded.command);
      inputs.push(encoded.inputs);
    }

    const commandsBytes = '0x' + commands.map(c => c.toString(16).padStart(2, '0')).join('');

    const arbParams = {
      initiator: this.executionSigner.address,
      titheRecipient: this.executionSigner.address, // Placeholder - should come from config
      titheBps: 0, // Placeholder - should come from config
      isGasEstimation: false,
      commands: commandsBytes,
      inputs: inputs,
    };

    const flashSwap = FlashSwap__factory.connect(flashSwapContractAddress, this.executionSigner);

    // Assume the first trade action defines the loan parameters
    const loanAction = opportunity.tradeActions[0];
    const loanAsset = loanAction.tokenIn!;
    const loanAmount = loanAction.amount;

    const assets = [loanAsset];
    const amounts = [loanAmount];
    const modes = [0]; // 0 = No debt token, simple flash loan
    const referralCode = 0;

    const abiCoder = AbiCoder.defaultAbiCoder();
    const encodedParams = abiCoder.encode(
      ['(address,address,uint256,bool,bytes,bytes[])'],
      [[
        arbParams.initiator,
        arbParams.titheRecipient,
        arbParams.titheBps,
        arbParams.isGasEstimation,
        arbParams.commands,
        arbParams.inputs
      ]]
    );

    const populatedTx = await flashSwap.initiateAaveFlashLoan.populateTransaction(
      assets,
      amounts,
      modes,
      encodedParams,
      referralCode
    );

    if (!this.executionSigner.provider) {
        throw new Error("Execution signer does not have a provider.");
    }

    const targetBlock = (await this.executionSigner.provider.getBlockNumber()) + 1;
    const signedTx = await this.executionSigner.signTransaction(populatedTx);

    logger.info(`[ExecutionManager] Submitting transaction to Flashbots for block ${targetBlock}.`);

    const flashbotsTxs: FlashbotsTransaction[] = [{ signedTransaction: signedTx }];
    return this.flashbotsService.sendBundle(flashbotsTxs, targetBlock);
  }
}
