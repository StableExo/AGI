import { ethers } from 'ethers';

/**
 * @class DataService
 * @description The eyes and ears of the system on the blockchain.
 * This service is responsible for ingesting real-time data from DEXs,
 * including pool liquidity, prices, and token information.
 */
export class DataService {
  private provider: ethers.JsonRpcProvider;

  /**
   * @constructor
   * @param {string} rpcUrl - The URL of the Ethereum JSON-RPC provider.
   */
  constructor(rpcUrl: string) {
    console.log(`[DataService] Initializing connection to RPC provider at ${rpcUrl}...`);
    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      console.log('[DataService] Connection established successfully.');
    } catch (error) {
      console.error('[DataService] Failed to establish connection to RPC provider.', error);
      throw error;
    }
  }

  /**
   * A simple method to verify the connection by getting the latest block number.
   * @returns {Promise<number>} The latest block number.
   */
  public async getBlockNumber(): Promise<number> {
    console.log('[DataService] Fetching latest block number to verify connection...');
    const blockNumber = await this.provider.getBlockNumber();
    console.log(`[DataService] Current block number is: ${blockNumber}`);
    return blockNumber;
  }
}