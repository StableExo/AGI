import { ArbitrageOpportunity } from '../models/ArbitrageOpportunity';
import { ExchangeDataProvider } from './ExchangeDataProvider';
import { ITradeReceipt } from '../interfaces/ITradeReceipt';
import { FlashSwap__factory } from '../../typechain-types'; // Correct path to generated types

// Define the structure for the contract's ArbParams
// This must match the struct in FlashSwap.sol
interface IArbParams {
  initiator: string;
  titheRecipient: string;
  titheBps: ethers.BigNumberish;
  isGasEstimation: boolean;
  path: ISwapStep[];
}

interface ISwapStep {
  dexType: number;
  tokenIn: string;
  tokenOut: string;
  minAmountOut: ethers.BigNumberish;
  poolOrRouter: string;
  poolFee: number;
}

export class ExecutionManager {
  private flashbotsService: FlashbotsService;
  private executionSigner: Wallet;
  private flashSwapInterface: Interface;

  constructor(flashbotsService: FlashbotsService, executionSigner: Wallet) {
    this.flashbotsService = flashbotsService;
    this.executionSigner = executionSigner;
    this.flashSwapInterface = FlashSwap__factory.createInterface();
    console.log(`[ExecutionManager] Initialized for Flashbots execution.`);
  }

  /**
   * Executes an arbitrage opportunity by encoding it for the FlashSwap contract
   * and submitting it as a bundle to Flashbots.
   * @param opportunity - The arbitrage opportunity, enriched with on-chain data.
   * @param flashSwapContractAddress - The address of the deployed FlashSwap contract.
   * @returns A promise that resolves with a boolean indicating if the bundle was included.
   */
  public async executeTrade(opportunity: ArbitrageOpportunity): Promise<ITradeReceipt[]> {
    const receipts: ITradeReceipt[] = [];

    console.log(`[ExecutionManager] Received trade to execute: ${opportunity.getSummary()}`);

    for (const action of opportunity.actions) {
      const executor = this.dataProvider.getExecutor(action.exchange);

    // 2. Encode the calldata for the initiateUniswapV3FlashLoan function
    const encodedArbParams = this.flashSwapInterface.encodeFunctionData('initiateUniswapV3FlashLoan', [
      opportunity.flashLoanPool,
      opportunity.flashLoanToken,
      opportunity.flashLoanAmount,
      ethers.utils.defaultAbiCoder.encode(
        ['(address,address,uint256,bool,(uint8,address,address,uint256,address,uint24)[])'],
        [[
          arbParams.initiator,
          arbParams.titheRecipient,
          arbParams.titheBps,
          arbParams.isGasEstimation,
          arbParams.path
        ]]
      )
    ]);

    // 3. Construct the transaction
    const transaction = {
      to: flashSwapContractAddress,
      data: encodedArbParams,
      value: '0',
      gasLimit: ethers.BigNumber.from(1000000), // High gas limit for safety
      chainId: (await this.executionSigner.getChainId()),
      signer: this.executionSigner,
    };

    // 4. Submit the transaction as a bundle to Flashbots
    try {
      const blockNumber = await this.executionSigner.provider.getBlockNumber();
      const targetBlock = blockNumber + 1; // Target the next block

      console.log(`[ExecutionManager] Submitting Flashbots bundle for target block: ${targetBlock}`);
      const wasIncluded = await this.flashbotsService.sendBundle([transaction], targetBlock);

      if (wasIncluded) {
        console.log(`[ExecutionManager] SUCCESS: Flashbots bundle was included in block ${targetBlock}.`);
      } else {
        console.warn(`[ExecutionManager] WARNING: Flashbots bundle was NOT included in block ${targetBlock}.`);
      }
      return wasIncluded;
    } catch (error: any) {
      console.error(`[ExecutionManager] CRITICAL: Failed to submit Flashbots bundle. Error: ${error.message}`);
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