import { ethers } from 'ethers';
import { Pool as UniswapPool } from '@uniswap/v3-sdk';
import { Token as UniswapToken } from '@uniswap/sdk-core';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import { Pool, Token } from '../types';

// Minimal ERC20 ABI for fetching token metadata
const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
];

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

  /**
   * Fetches live data for a specific Uniswap V3 pool.
   * @param {string} poolAddress - The address of the Uniswap V3 pool.
   * @returns {Promise<Pool>} A promise that resolves to a Pool object.
   */
  public async getPoolData(poolAddress: string): Promise<Pool> {
    console.log(`[DataService] Fetching data for pool: ${poolAddress}`);
    const poolContract = new ethers.Contract(poolAddress, IUniswapV3PoolABI.abi, this.provider);

    // Fetch token addresses and slot0 in parallel
    const [token0Address, token1Address, slot0] = await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.slot0(),
    ]);

    // Fetch token metadata in parallel
    const [token0, token1] = await Promise.all([
      this.getTokenDetails(token0Address),
      this.getTokenDetails(token1Address),
    ]);

    // Extract sqrtPriceX96 from slot0
    const sqrtPriceX96 = slot0.sqrtPriceX96;

    // Use the Uniswap SDK to calculate the price
    const sdkToken0 = new UniswapToken(1, token0.address, token0.decimals, token0.symbol);
    const sdkToken1 = new UniswapToken(1, token1.address, token1.decimals, token1.symbol);

    // The SDK requires a Pool object to be constructed to get the price
    // Note: Liquidity and tick are not needed for price calculation, so we can use dummy values.
    const pool = new UniswapPool(sdkToken0, sdkToken1, 3000, sqrtPriceX96.toString(), '0', 0);
    const priceOfToken0 = parseFloat(pool.token0Price.toSignificant(6));

    console.log(`[DataService] Price of ${token0.symbol} in ${token1.symbol}: ${priceOfToken0}`);

    return {
      address: poolAddress,
      tokenA: token0,
      tokenB: token1,
      price: priceOfToken0, // Price of tokenA (token0) in terms of tokenB (token1)
    };
  }

  /**
   * A helper function to fetch the symbol and decimals for a given token address.
   * @param {string} tokenAddress - The address of the ERC20 token.
   * @returns {Promise<Token>} A promise that resolves to a Token object.
   */
  private async getTokenDetails(tokenAddress: string): Promise<Token> {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    const [symbol, decimals] = await Promise.all([
      tokenContract.symbol(),
      tokenContract.decimals(),
    ]);
    return { address: tokenAddress, symbol, decimals: Number(decimals) };
  }
}