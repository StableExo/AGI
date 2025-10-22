import { AbiCoder, Wallet } from 'ethers';
import { ArbitrageOpportunity } from '../models/ArbitrageOpportunity';
import { FlashbotsService, FlashbotsTransaction } from './FlashbotsService';
import logger from './logger.service';
import { ExchangeDataProvider } from './ExchangeDataProvider';
import { ITradeAction } from '../models/ITradeAction';
import { UniversalRouterEncoder } from './UniversalRouterEncoder.service';
import { FlashSwap__factory } from '../../typechain-types';
import { TransactionService } from './TransactionService';

export class ExecutionManager {
  private flashbotsService: FlashbotsService;
  private executionSigner: Wallet;
  private exchangeDataProvider: ExchangeDataProvider;
  private routerEncoder: UniversalRouterEncoder;
  private transactionService: TransactionService;

  constructor(
    flashbotsService: FlashbotsService,
    executionSigner: Wallet,
    exchangeDataProvider: ExchangeDataProvider,
    transactionService: TransactionService,
  ) {
    this.flashbotsService = flashbotsService;
    this.executionSigner = executionSigner;
    this.exchangeDataProvider = exchangeDataProvider;
    this.transactionService = transactionService;
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
   * Orchestrates the execution of a DEX arbitrage opportunity.
   * Delegates the low-level transaction logic to the TransactionService.
   * @param opportunity - The arbitrage opportunity to execute.
   * @returns A promise that resolves with an object indicating success and the transaction hash.
   */
  public async executeTrade(
    opportunity: ArbitrageOpportunity,
  ): Promise<{ success: boolean; txHash?: string; }> {
    logger.info(
      `[ExecutionManager] Orchestrating execution for opportunity with profit: ${opportunity.profit}`,
    );

    if (!opportunity.tradeActions || opportunity.tradeActions.length === 0) {
      logger.warn('[ExecutionManager] Opportunity has no trade actions. Aborting.');
      return { success: false };
    }

    try {
      // Delegate the entire execution process to the TransactionService
      const result = await this.transactionService.executeTrade(opportunity);

      if (result.success) {
        logger.info(`[ExecutionManager] Transaction processed successfully by TransactionService. TxHash: ${result.txHash}`);
        // Here you could add post-execution logic, e.g., notifying other services.
      } else {
        logger.error(`[ExecutionManager] TransactionService reported a failure for opportunity.`);
      }

      return result;

    } catch (error: any) {
      logger.error(`[ExecutionManager] An unexpected error occurred during trade orchestration: ${error.message}`, { error });
      return { success: false };
    }
  }
}
