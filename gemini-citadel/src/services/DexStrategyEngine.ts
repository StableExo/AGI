import { ExchangeDataProvider } from './ExchangeDataProvider';
import { ArbitrageOpportunity } from '../models/ArbitrageOpportunity';
import { ITradeAction } from '../models/ITradeAction';
import { ITradePair } from '../interfaces/ITradePair';
import logger from './logger.service';

export class DexStrategyEngine {
  private readonly dataProvider: ExchangeDataProvider;

  constructor(dataProvider: ExchangeDataProvider) {
    this.dataProvider = dataProvider;
  }

  public async findOpportunities(pairs: ITradePair[]): Promise<ArbitrageOpportunity[]> {
    const opportunities: ArbitrageOpportunity[] = [];
    const cexFetchers = this.dataProvider.getAllCexFetchers();
    const dexFetchers = this.dataProvider.getAllFetchers();

    if (cexFetchers.size === 0 || dexFetchers.size === 0) {
      logger.warn('[DexStrategyEngine] Need at least one CEX and one DEX fetcher to find opportunities.');
      return [];
    }

    for (const [cexId, cexFetcher] of cexFetchers.entries()) {
      for (const [dexId, dexFetcher] of dexFetchers.entries()) {
        for (const pair of pairs) {
          try {
            const pairStr = `${pair.base}/${pair.quote}`;
            const [cexPrice, dexPrice] = await Promise.all([
              cexFetcher.getTicker(pair),
              dexFetcher.fetchPrice(pairStr), // Assuming fetchPrice for DEXs
            ]);

            const cexFee = this.dataProvider.getCexFee(cexId)!;
            const dexFee = this.dataProvider.getFee(dexId)!;

            // Scenario 1: Buy on CEX, Sell on DEX
            const profit1 = (dexPrice * (1 - dexFee)) - (cexPrice.price * (1 + cexFee));
            if (profit1 > 0) {
              const buyAction: ITradeAction = {
                action: 'BUY',
                exchange: cexId,
                pair: pairStr,
                price: cexPrice.price,
                amount: 1, // Placeholder amount
              };
              const sellAction: ITradeAction = {
                action: 'SELL',
                exchange: dexId,
                pair: pairStr,
                price: dexPrice,
                amount: 1,
              };
              opportunities.push(new ArbitrageOpportunity(BigInt(Math.trunc(profit1 * 1e18)), [buyAction, sellAction]));
            }

            // Scenario 2: Buy on DEX, Sell on CEX
            const profit2 = (cexPrice.price * (1 - cexFee)) - (dexPrice * (1 + dexFee));
            if (profit2 > 0) {
              const buyAction: ITradeAction = {
                action: 'BUY',
                exchange: dexId,
                pair: pairStr,
                price: dexPrice,
                amount: 1,
              };
              const sellAction: ITradeAction = {
                action: 'SELL',
                exchange: cexId,
                pair: pairStr,
                price: cexPrice.price,
                amount: 1,
              };
              opportunities.push(new ArbitrageOpportunity(BigInt(Math.trunc(profit2 * 1e18)), [buyAction, sellAction]));
            }
          } catch (error) {
            logger.error(`[DexStrategyEngine] Error comparing ${pair.base}/${pair.quote} between ${cexId} and ${dexId}:`, error);
          }
        }
      }
    }

    return opportunities;
  }
}
