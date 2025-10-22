// gemini-citadel/src/havoc-core/core/fetchers/UniswapV3Fetcher.ts
import { ethers, Provider } from 'ethers';
import { Token } from '@uniswap/sdk-core';
import { IUniswapV3PoolABI } from '../../constants/abis';
import { IFetcher } from '../interfaces/IFetcher';
import { IPoolData } from '../interfaces/IPoolData';
import logger from '../../../services/logger.service';

// A simple in-memory cache for pool contracts
const poolContractCache: { [address: string]: ethers.Contract } = {};

export class UniswapV3Fetcher implements IFetcher {
  private provider: Provider;

  constructor(provider: Provider) {
    this.provider = provider;
  }

  private _getPoolContract(address: string): ethers.Contract {
    const lowerCaseAddress = address.toLowerCase();
    if (!poolContractCache[lowerCaseAddress]) {
      poolContractCache[lowerCaseAddress] = new ethers.Contract(address, IUniswapV3PoolABI, this.provider);
    }
    return poolContractCache[lowerCaseAddress];
  }

  public async fetchPoolData(address: string, pair: [Token, Token]): Promise<{ success: boolean; poolData: IPoolData | null; error: string | null }> {
    const logPrefix = `[UniswapV3Fetcher Pool ${address.substring(0, 6)}]`;
    logger.debug(`${logPrefix} Fetching state`);

    try {
      const [token0, token1] = pair;
      const poolContract = this._getPoolContract(address);

      const [slot0, liquidity, fee] = await Promise.all([
        poolContract.slot0(),
        poolContract.liquidity(),
        poolContract.fee(),
      ]);

      const currentLiquidity = BigInt(liquidity.toString());
      if (currentLiquidity === 0n) {
        logger.debug(`${logPrefix} Skipping due to zero liquidity.`);
        return { success: false, poolData: null, error: 'Zero liquidity' };
      }

      const poolData: IPoolData = {
        address: address,
        dexType: 'uniswapV3',
        fee: Number(fee),
        tick: Number(slot0.tick),
        liquidity: currentLiquidity,
        sqrtPriceX96: BigInt(slot0.sqrtPriceX96.toString()),
        tickSpacing: 0, // This will be calculated later
        token0: token0,
        token1: token1,
        token0Symbol: token0.symbol!,
        token1Symbol: token1.symbol!,
        groupName: 'N/A', // This can be enriched later
        pairKey: `${token0.symbol}/${token1.symbol}`,
        timestamp: Date.now(),
      };

      logger.debug(`${logPrefix} Successfully processed fetched state.`);
      return { success: true, poolData: poolData, error: null };

    } catch (error: any) {
      logger.error(`${logPrefix} Failed to fetch state: ${error.message}`, error);
      return { success: false, poolData: null, error: error.message };
    }
  }
}
