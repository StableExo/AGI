import { Contract, JsonRpcProvider } from 'ethers';
import { Contract as ContractV5, providers as providersV5 } from 'ethers-v5'; // Ethers v5 alias for Uniswap SDK
import { Pool } from '../interfaces/Pool';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';

const ERC20_ABI = ["function symbol() view returns (string)", "function decimals() view returns (uint8)"];

export class DataService {
  private provider: JsonRpcProvider;
  // The v5 provider is needed for compatibility with the Uniswap V3 SDK.
  private providerV5: providersV5.StaticJsonRpcProvider;
  private rpcUrl: string;

  /**
   * @constructor
   * @param {string} rpcUrl - The URL of the Ethereum JSON-RPC provider.
   */
  constructor(rpcUrl: string) {
    console.log(`[DataService] Initializing connection to RPC provider...`);
    try {
      // For v6, we connect once and cache the network. This is more efficient.
      this.provider = new JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });

      // For v5, we use StaticJsonRpcProvider. The standard JsonRpcProvider's
      // auto-detection can be brittle. StaticJsonRpcProvider detects the network
      // once and caches it, which is more reliable.
      this.providerV5 = new providersV5.StaticJsonRpcProvider(rpcUrl);

      this.rpcUrl = rpcUrl;
      console.log('[DataService] Connection established successfully.');
    } catch (error) {
      console.error('[DataService] Failed to establish connection to RPC provider.', error);
      throw error;
    }
  }

  /**
   * Verifies the connection by getting the latest block number.
   * @returns {Promise<number>} The latest block number.
   */
  public async getBlockNumber(): Promise<number> {
    console.log('[DataService] Fetching latest block number...');
    const blockNumber = await this.provider.getBlockNumber();
    console.log(`[DataService] Current block number is: ${blockNumber}`);
    return blockNumber;
  }

  public async getV3PoolData(address: string): Promise<Pool> {
    try {
      // For SDK compatibility, we use the pre-initialized ethers-v5 provider.
      const poolContract = new ContractV5(address, IUniswapV3PoolABI.abi, this.providerV5);

      const [slot0, liquidity, token0Address, token1Address, fee] = await Promise.all([
        poolContract.slot0(),
        poolContract.liquidity(),
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
      ]);

      // The v6 provider is still used for the ERC20 token contracts.
      const token0Contract = new Contract(token0Address, ERC20_ABI, this.provider);
      const token1Contract = new Contract(token1Address, ERC20_ABI, this.provider);

      const [token0Symbol, token0Decimals] = await Promise.all([token0Contract.symbol(), token0Contract.decimals()]);
      const [token1Symbol, token1Decimals] = await Promise.all([token1Contract.symbol(), token1Contract.decimals()]);

      return {
        address,
        dex: 'UniswapV3',
        token0: { address: token0Address, symbol: token0Symbol, decimals: Number(token0Decimals) },
        token1: { address: token1Address, symbol: token1Symbol, decimals: Number(token1Decimals) },
        fee: Number(fee),
        sqrtPriceX96: slot0.sqrtPriceX96,
        liquidity: liquidity,
        tick: Number(slot0.tick),
      };
    } catch (error) {
      console.error(`[DataService] Error fetching data for pool ${address}:`, error);
      throw new Error(`Failed to fetch data for V3 pool ${address}`);
    }
  }
}