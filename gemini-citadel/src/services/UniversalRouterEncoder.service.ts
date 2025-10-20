import { AbiCoder, solidityPacked } from 'ethers';

/**
 * Corresponds to the Commands.sol library in the Universal Router.
 * This enum defines the command bytes for various actions.
 */
export enum UniversalRouterCommand {
  V3_SWAP_EXACT_IN = 0x00,
  V3_SWAP_EXACT_OUT = 0x01,
  V2_SWAP_EXACT_IN = 0x08,
  V2_SWAP_EXACT_OUT = 0x09,
  WRAP_ETH = 0x0b,
  UNWRAP_WETH = 0x0c,
}

/**
 * A dedicated service for encoding commands and inputs for the Uniswap Universal Router.
 * This class provides methods to translate high-level trade intentions into the
 * low-level byte strings required by the UniversalRouter.sol contract.
 */
export class UniversalRouterEncoder {
  private readonly abiCoder: AbiCoder;

  constructor() {
    this.abiCoder = AbiCoder.defaultAbiCoder();
  }

  /**
   * Encodes a V3_SWAP_EXACT_IN command for the Universal Router.
   * @param recipient The recipient of the output tokens.
   * @param amountIn The amount of input tokens for the trade.
   * @param amountOutMin The minimum amount of output tokens desired.
   * @param path The Uniswap V3 path, as an array of [tokenIn, fee, tokenOut, ...].
   * @param payerIsUser True if funds are to be pulled from msg.sender, false if they are already in the router.
   * @returns An object containing the command byte and the ABI-encoded inputs string.
   */
  public encodeV3SwapExactIn(
    recipient: string,
    amountIn: bigint,
    amountOutMin: bigint,
    path: (string | number)[],
    payerIsUser: boolean,
  ): { command: number; inputs: string } {
    const command = UniversalRouterCommand.V3_SWAP_EXACT_IN;

    const pathTypes: string[] = [];
    for (let i = 0; i < path.length; i++) {
      pathTypes.push(i % 2 === 0 ? 'address' : 'uint24');
    }
    const encodedPath = solidityPacked(pathTypes, path);

    const inputs = this.abiCoder.encode(
      ['address', 'uint256', 'uint256', 'bytes', 'bool'],
      [recipient, amountIn, amountOutMin, encodedPath, payerIsUser],
    );

    return { command, inputs };
  }
}
