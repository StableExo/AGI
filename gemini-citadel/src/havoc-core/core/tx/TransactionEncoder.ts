// gemini-citadel/src/havoc-core/core/tx/TransactionEncoder.ts
import { Interface } from 'ethers';
import logger from '../../../services/logger.service';
import { FlashSwap__factory } from '../../../../typechain-types'; // Using TypeChain for ABI

const logPrefix = '[TransactionEncoder]';

export class TransactionEncoder {
  private readonly flashSwapInterface: Interface;

  constructor() {
    // Utilize TypeChain to get the interface, ensuring it's always available at compile time
    this.flashSwapInterface = FlashSwap__factory.createInterface();
    logger.debug(`${logPrefix} Initialized.`);
  }

  /**
   * Encodes the function call data for a specific function on the FlashSwap contract.
   *
   * @param {string} functionName - The name of the function to call on FlashSwap.sol.
   * @param {Array<any>} functionArgs - The ordered array of arguments for the specified function.
   * @returns {string} The ABI-encoded transaction calldata (bytes string).
   * @throws {Error} If encoding fails.
   */
  public encodeFlashSwapCall(functionName: string, functionArgs: any[]): string {
    logger.debug(`${logPrefix} Encoding function call data for ${functionName}`, { functionArgs });

    if (!functionName || !Array.isArray(functionArgs)) {
      const errorMsg = 'Missing functionName or invalid functionArgs for encoding.';
      logger.error(`${logPrefix} ${errorMsg}`);
      throw new Error(errorMsg);
    }

    try {
      const calldata = this.flashSwapInterface.encodeFunctionData(functionName, functionArgs);
      logger.debug(`${logPrefix} Function call encoded successfully: ${calldata.substring(0, 74)}...`);
      return calldata;
    } catch (error: any) {
      const errorMessage = `Failed to encode FlashSwap function call for ${functionName}: ${error.message}`;
      logger.error(`${logPrefix} ${errorMessage}`, {
        functionName,
        error: error.message,
      });
      throw new Error(errorMessage);
    }
  }
}
