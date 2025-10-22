// gemini-citadel/src/havoc-core/core/finders/SpatialFinder.ts
import { IPoolData } from '../interfaces/IPoolData';
import { ArbitrageOpportunity } from '../../../models/ArbitrageOpportunity';
import { ITradeAction } from '../../../models/ITradeAction';
import logger from '../../../services/logger.service';
import { PriceV3, getPriceForAmount } from '../calculation/priceCalculation';

const BASIS_POINTS_DENOMINATOR = 10000n;

export class SpatialFinder {
  private minNetPriceDiffBips: bigint;

  constructor(minNetPriceDiffBips = 10n) { // Default to 10 bips
    this.minNetPriceDiffBips = minNetPriceDiffBips;
  }

  public findArbitrage(pools: IPoolData[]): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];
    if (pools.length < 2) {
      return opportunities;
    }

    for (let i = 0; i < pools.length; i++) {
      for (let j = i + 1; j < pools.length; j++) {
        const poolA = pools[i];
        const poolB = pools[j];

        // Ensure we are comparing pools for the same token pair
        if (poolA.pairKey !== poolB.pairKey) {
          continue;
        }

        const priceA = new PriceV3(poolA.sqrtPriceX96, poolA.token0, poolA.token1);
        const priceB = new PriceV3(poolB.sqrtPriceX96, poolB.token0, poolB.token1);

        let poolBuy: IPoolData, poolSell: IPoolData;
        let priceBuy: PriceV3, priceSell: PriceV3;

        if (priceA.lessThan(priceB)) {
          poolBuy = poolA;
          priceBuy = priceA;
          poolSell = poolB;
          priceSell = priceB;
        } else {
          poolBuy = poolB;
          priceBuy = priceB;
          poolSell = poolA;
          priceSell = priceA;
        }

        const rawPriceDiff = priceSell.quote(poolBuy.token0) - priceBuy.quote(poolBuy.token0);
        if (rawPriceDiff <= 0) continue;

        const rawDiffBips = (BigInt(Math.round(rawPriceDiff * 10000))) / BigInt(Math.round(priceBuy.quote(poolBuy.token0)));

        if (rawDiffBips >= this.minNetPriceDiffBips) {
          const opportunity = this._createOpportunity(poolBuy, poolSell);
          if (opportunity) {
            opportunities.push(opportunity);
          }
        }
      }
    }
    return opportunities;
  }

  private _createOpportunity(poolBuy: IPoolData, poolSell: IPoolData): ArbitrageOpportunity | null {
    const amountIn = 10n ** BigInt(poolBuy.token1.decimals); // Simulate with 1 unit of token1

    const { amountOut: intermediateAmount } = getPriceForAmount(amountIn, poolBuy);
    if (intermediateAmount <= 0n) return null;

    const { amountOut: finalAmount } = getPriceForAmount(intermediateAmount, poolSell);
    if (finalAmount <= amountIn) return null;

    const profit = finalAmount - amountIn;

    const buyAction: ITradeAction = {
      action: 'BUY',
      exchange: poolBuy.dexType,
      pair: poolBuy.pairKey,
      price: 0, // Prices will be calculated during execution
      amount: Number(amountIn),
      tokenIn: poolBuy.token1.address,
      tokenOut: poolBuy.token0.address,
      poolFee: poolBuy.fee,
    };

    const sellAction: ITradeAction = {
      action: 'SELL',
      exchange: poolSell.dexType,
      pair: poolSell.pairKey,
      price: 0,
      amount: Number(intermediateAmount),
      tokenIn: poolSell.token0.address,
      tokenOut: poolSell.token1.address,
      poolFee: poolSell.fee,
    };

    return new ArbitrageOpportunity(Number(profit), [buyAction, sellAction]);
  }
}
