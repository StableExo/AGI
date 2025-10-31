/**
 * DEX Integration Types
 */

/**
 * DEX configuration interface
 */
export interface DEXConfig {
  name: string;
  protocol: string;
  chainId: number;
  router: string;
  factory: string;
  initCodeHash: string;
  priority: number;
  liquidityThreshold: bigint;
  gasEstimate: number;
}
