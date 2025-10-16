import { ethers, Interface, Wallet, BigNumberish, AbiCoder } from 'ethers';
import { ArbitrageOpportunity } from '../models/ArbitrageOpportunity';
import { FlashbotsService } from './FlashbotsService';
import logger from './logger.service';
import { ITradeReceipt } from '../interfaces/ITradeReceipt';
import { FlashSwap__factory } from '../../typechain-types'; // Correct path to generated types
import { ISwapStep } from '../interfaces/ITradeAction';

// Define the structure for the contract's ArbParams
// This must match the struct in FlashSwap.sol
interface IArbParams {
  initiator: string;
  titheRecipient: string;
  titheBps: BigNumberish;
  isGasEstimation: boolean;
  path: ISwapStep[];
}

export class ExecutionManager {
  private flashbotsService: FlashbotsService;
  private executionSigner: Wallet;
  private flashSwapInterface: Interface;

  constructor(flashbotsService: FlashbotsService, executionSigner: Wallet) {
    this.flashbotsService = flashbotsService;
    this.executionSigner = executionSigner;
    this.flashSwapInterface = FlashSwap__factory.createInterface();
    logger.info(`[ExecutionManager] Initialized for Flashbots execution.`);
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
    flashSwapContractAddress: string
  ): Promise<boolean> {
    logger.info(`[ExecutionManager] Received opportunity for Flashbots execution: ${opportunity.getSummary()}`);

    if (!this.executionSigner.provider) {
      throw new Error("Execution signer must have a provider.");
    }

    // 1. Prepare the parameters for the smart contract call
    const arbParams: IArbParams = {
      initiator: this.executionSigner.address,
      titheRecipient: '0x000000000000000000000000000000000000dEaD', // Placeholder
      titheBps: 0, // Placeholder
      isGasEstimation: false,
      path: this.mapActionsToSwapSteps(opportunity),
    };

    // 2. Encode the calldata for the initiateUniswapV3FlashLoan function
    const encodedArbParams = this.flashSwapInterface.encodeFunctionData('initiateUniswapV3FlashLoan', [
      opportunity.flashLoanPool,
      opportunity.flashLoanToken,
      opportunity.flashLoanAmount,
      AbiCoder.defaultAbiCoder().encode(
        ['(address,address,uint256,bool,(uint8,address,address,uint256,address,uint24)[])'],
        [[
          arbParams.initiator,
          arbParams.titheRecipient,
          arbParams.titheBps,
          arbParams.isGasEstimation,
          arbParams.path.map(step => [
            step.dexType,
            step.tokenIn,
            step.tokenOut,
            step.minAmountOut,
            step.poolOrRouter,
            step.poolFee,
          ]),
        ]]
      )
    ]);

    // 3. Construct the transaction
    const network = await this.executionSigner.provider.getNetwork();
    const transaction = {
      to: flashSwapContractAddress,
      data: encodedArbParams,
      value: '0',
      gasLimit: 1000000n, // High gas limit for safety
      chainId: network.chainId,
    };

    // 4. Submit the transaction as a bundle to Flashbots
    try {
      const blockNumber = await this.executionSigner.provider.getBlockNumber();
      const targetBlock = blockNumber + 1; // Target the next block

      logger.info(`[ExecutionManager] Submitting Flashbots bundle for target block: ${targetBlock}`);
      const wasIncluded = await this.flashbotsService.sendBundle(
        [{ signer: this.executionSigner, transaction: transaction }],
        targetBlock
      );

      if (wasIncluded) {
        logger.info(`[ExecutionManager] SUCCESS: Flashbots bundle was included in block ${targetBlock}.`);
      } else {
        logger.warn(`[ExecutionManager] WARNING: Flashbots bundle was NOT included in block ${targetBlock}.`);
      }
      return wasIncluded;
    } catch (error: any) {
      logger.error(`[ExecutionManager] CRITICAL: Failed to submit Flashbots bundle. Error: ${error.message}`);
      return false;
    }
  }

  private mapActionsToSwapSteps(opportunity: ArbitrageOpportunity): ISwapStep[] {
    // This mapping logic is critical and assumes the opportunity's actions
    // are enriched with the necessary on-chain data (pool addresses, fees, etc.)
    // which would be the responsibility of the StrategyEngine.
    return opportunity.actions.map(action => {
      if (!action.onChainData) {
        throw new Error(`[ExecutionManager] Action is missing on-chain data needed for FlashSwap contract.`);
      }
      return {
        dexType: action.onChainData.dexType,
        tokenIn: action.onChainData.tokenIn,
        tokenOut: action.onChainData.tokenOut,
        minAmountOut: action.onChainData.minAmountOut,
        poolOrRouter: action.onChainData.poolOrRouter,
        poolFee: action.onChainData.poolFee,
      };
    });
  }
}