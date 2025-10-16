import { Wallet } from 'ethers';
import { ArbitrageOpportunity } from '../models/ArbitrageOpportunity';
import { FlashbotsService } from './FlashbotsService';
import logger from './logger.service';
import { ExchangeDataProvider } from './ExchangeDataProvider';
import { ITradeAction } from '../models/ITradeAction';

export class ExecutionManager {
  private flashbotsService: FlashbotsService;
  private executionSigner: Wallet;
  private exchangeDataProvider: ExchangeDataProvider;

  constructor(
    flashbotsService: FlashbotsService,
    executionSigner: Wallet,
    exchangeDataProvider: ExchangeDataProvider,
  ) {
    this.flashbotsService = flashbotsService;
    this.executionSigner = executionSigner;
    this.exchangeDataProvider = exchangeDataProvider;
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
   * Executes an arbitrage opportunity by encoding it for the FlashSwap contract
   * and submitting it as a bundle to Flashbots.
   * @param opportunity - The arbitrage opportunity, enriched with on-chain data.
   * @param flashSwapContractAddress - The address of the deployed FlashSwap contract.
   * @returns A promise that resolves with a boolean indicating if the bundle was included.
   */
  public async executeTrade(
    opportunity: ArbitrageOpportunity,
    flashSwapContractAddress: string,
  ): Promise<boolean> {
    throw new Error(
      'On-chain DEX execution is not implemented in this version.',
    );
  }
}