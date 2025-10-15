import { IFetcher } from '../../interfaces/IFetcher';
import { providers } from 'ethers-v5';
import { Pool } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import { Contract } from 'ethers-v5';
import { POOLS } from '../../config/pools.config';

export class UniswapFetcher implements IFetcher {
    private provider: providers.JsonRpcProvider;

    constructor() {
        if (!process.env.RPC_URL) {
            throw new Error('RPC_URL environment variable is not set.');
        }
        this.provider = new providers.JsonRpcProvider(process.env.RPC_URL);
    }

    async fetchPrice(pair: string): Promise<number> {
        const poolInfo = POOLS[pair];
        if (!poolInfo) {
            throw new Error(`Unsupported pair for Uniswap: ${pair}`);
        }

        const { token0, token1, fee, poolAddress } = poolInfo;

        const poolContract = new Contract(poolAddress, IUniswapV3PoolABI.abi, this.provider);

        const [slot0, liquidity] = await Promise.all([
            poolContract.slot0(),
            poolContract.liquidity(),
        ]);

        const pool = new Pool(
            token0 as Token,
            token1 as Token,
            fee,
            slot0.sqrtPriceX96.toString(),
            liquidity.toString(),
            slot0.tick
        );

        const priceOfToken0InToken1 = parseFloat(pool.token0Price.toSignificant(6));
        // Since the standard is to quote in terms of the second currency (e.g. USD in BTC/USD),
        // and our pair is WBTC/WETH, we want the price of WBTC in WETH.
        // The pool gives us the price of token0 (WBTC) in terms of token1 (WETH), which is what we want.
        console.log(`[UniswapFetcher] Successfully fetched price for ${pair}: ${priceOfToken0InToken1}`);
        return priceOfToken0InToken1;
    }

    async fetchOrderBook(pair: string): Promise<any> {
        // Not applicable for a DEX like Uniswap in this context
        return Promise.resolve({});
    }
}