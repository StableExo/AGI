import { ExchangeDataProvider } from './ExchangeDataProvider';
import { ArbitrageOpportunity } from '../models/ArbitrageOpportunity';
import { ITradeAction } from '../models/ITradeAction';
import { ITradePair } from '../interfaces/ITradePair';
import { ICexFetcher } from '../interfaces/ICexFetcher';
import logger from './logger.service';

export class CexStrategyEngine {
  private readonly dataProvider: ExchangeDataProvider;

  constructor(dataProvider: ExchangeDataProvider) {
    this.dataProvider = dataProvider;
  }

  public async findOpportunities(pairs: ITradePair[]): Promise<ArbitrageOpportunity[]> {
    const opportunities: ArbitrageOpportunity[] = [];
    const fetchers = this.dataProvider.getAllCexFetchers();
    const exchangeIds = Array.from(fetchers.keys());

    if (exchangeIds.length < 2) {
      logger.warn('[CexStrategyEngine] Need at least two CEX fetchers to find arbitrage opportunities.');
      return [];
    }

    // This loop structure compares every exchange with every other exchange.
    for (let i = 0; i < exchangeIds.length; i++) {
      for (let j = i + 1; j < exchangeIds.length; j++) {
        const exchangeAId = exchangeIds[i];
        const exchangeBId = exchangeIds[j];
        const fetcherA = fetchers.get(exchangeAId)!;
        const fetcherB = fetchers.get(exchangeBId)!;

        // In a real system, you'd check for common pairs. Here we iterate through a provided list.
        for (const pair of pairs) {
          try {
            const [tickerA, tickerB] = await Promise.all([
              fetcherA.getTicker(pair),
              fetcherB.getTicker(pair),
            ]);

            const feeA = this.dataProvider.getCexFee(exchangeAId)!;
            const feeB = this.dataProvider.getCexFee(exchangeBId)!;

            // Scenario 1: Buy on A, Sell on B
            const profit1 = (tickerB.price * (1 - feeB)) - (tickerA.price * (1 + feeA));
            if (profit1 > 0) {
              const buyAction: ITradeAction = {
                action: 'BUY',
                exchange: exchangeAId,
                pair: `${pair.base}/${pair.quote}`,
                price: tickerA.price,
                amount: 1, // Assuming amount of 1 for now
              };
              const sellAction: ITradeAction = {
                action: 'SELL',
                exchange: exchangeBId,
                pair: `${pair.base}/${pair.quote}`,
                price: tickerB.price,
                amount: 1,
              };
              opportunities.push(new ArbitrageOpportunity(profit1, [buyAction, sellAction]));
            }

            // Scenario 2: Buy on B, Sell on A
            const profit2 = (tickerA.price * (1 - feeA)) - (tickerB.price * (1 + feeB));
            if (profit2 > 0) {
              const buyAction: ITradeAction = {
                action: 'BUY',
                exchange: exchangeBId,
                pair: `${pair.base}/${pair.quote}`,
                price: tickerB.price,
                amount: 1,
              };
              const sellAction: ITradeAction = {
                action: 'SELL',
                exchange: exchangeAId,
                pair: `${pair.base}/${pair.quote}`,
                price: tickerA.price,
                amount: 1,
              };
              opportunities.push(new ArbitrageOpportunity(profit2, [buyAction, sellAction]));
            }
          } catch (error) {
            logger.error(`[CexStrategyEngine] Error comparing ${pair.base}/${pair.quote} between ${exchangeAId} and ${exchangeBId}:`, error);
          }
        }
      }
    }

    return opportunities;
  }
}