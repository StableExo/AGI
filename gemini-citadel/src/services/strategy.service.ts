import { ExchangeDataProvider } from './ExchangeDataProvider';
import { ArbitrageOpportunity } from '../models/ArbitrageOpportunity';
import { ITradeAction } from '../interfaces/ITradeAction';
import { IFetcher } from '../interfaces/IFetcher';

// Configuration for the strategy engine.
// In a real-world scenario, this would be in a dedicated config file.
const MIN_PROFIT_THRESHOLD = 0.001; // Minimum profit to consider a trade (e.g., 0.1%)
const TRADE_AMOUNT = 1; // The amount of the base currency to trade.

export class StrategyEngine {
  private dataProvider: ExchangeDataProvider;

  constructor(dataProvider: ExchangeDataProvider) {
    this.dataProvider = dataProvider;
    console.log('[StrategyEngine] Initialized.');
  }

  /**
   * Analyzes market data to find profitable arbitrage opportunities.
   * This new logic is adapted from AxionCitadel's SpatialArbEngine.
   * It dynamically compares all available data sources for the same trading pair.
   * @returns A promise that resolves to an array of trade opportunities.
   */
  public async findOpportunities(): Promise<ArbitrageOpportunity[]> {
    console.log('[StrategyEngine] Analyzing markets for opportunities...');
    const opportunities: ArbitrageOpportunity[] = [];
    const fetchers = this.dataProvider.getAllFetchers();

    // In this simplified version, we'll assume all fetchers trade the same pair.
    // A more advanced implementation would group fetchers by the pairs they support.
    const tradingPair = 'BTC/USDT'; // Hardcoded for now

    const prices: { name: string, price: number, fee: number }[] = [];
    for (const [name, fetcher] of fetchers.entries()) {
        const price = await fetcher.fetchPrice(tradingPair);
        const fee = this.dataProvider.getFee(name);
        if (fee !== undefined) {
            prices.push({ name, price, fee });
        }
    }

    if (prices.length < 2) {
        console.log('[StrategyEngine] Not enough pricing sources to find an arbitrage opportunity.');
        return [];
    }

    // Compare every source with every other source
    for (let i = 0; i < prices.length; i++) {
        for (let j = i + 1; j < prices.length; j++) {
            const sourceA = prices[i];
            const sourceB = prices[j];

            // Opportunity: Buy on A, Sell on B
            this.evaluateOpportunity(sourceA, sourceB, tradingPair, opportunities);

            // Opportunity: Buy on B, Sell on A
            this.evaluateOpportunity(sourceB, sourceA, tradingPair, opportunities);
        }
    }

    return opportunities;
  }

  private evaluateOpportunity(
    buySource: { name: string, price: number, fee: number },
    sellSource: { name: string, price: number, fee: number },
    pair: string,
    opportunities: ArbitrageOpportunity[]
  ) {
    const buyPrice = buySource.price;
    const sellPrice = sellSource.price;

    if (sellPrice > buyPrice) {
      const spread = sellPrice - buyPrice;
      const totalFees = (buyPrice * buySource.fee) + (sellPrice * sellSource.fee);
      const estimatedProfit = (spread - totalFees) * TRADE_AMOUNT;

      console.log(`[StrategyEngine] Evaluating: Buy on ${buySource.name} (${buyPrice}), Sell on ${sellSource.name} (${sellPrice}). Profit: ${estimatedProfit}`);

      if (estimatedProfit > (buyPrice * MIN_PROFIT_THRESHOLD)) {
        console.log(`[StrategyEngine] Profitable opportunity found!`);
        const buyAction: ITradeAction = {
          action: 'Buy',
          exchange: buySource.name,
          pair,
          price: buyPrice,
          amount: TRADE_AMOUNT
        };
        const sellAction: ITradeAction = {
          action: 'Sell',
          exchange: sellSource.name,
          pair,
          price: sellPrice,
          amount: TRADE_AMOUNT
        };
        const opportunity = new ArbitrageOpportunity(estimatedProfit, [buyAction, sellAction]);
        opportunities.push(opportunity);
      }
    }
  }
}