import { ExchangeDataProvider } from './ExchangeDataProvider';
import { ITradeOpportunity } from '../interfaces/ITradeOpportunity';
import { MockFetcher } from '../protocols/mock/MockFetcher';

// Hardcoded configuration for trading pairs to be analyzed.
// This will be refactored into an external config file later.
const STRATEGY_PAIRS = [
    { exchangeA: 'btcc', exchangeB: 'mockExchange', symbol: 'BTC/USDT' }
];

export class StrategyEngine {
  private dataProvider: ExchangeDataProvider;

  constructor(dataProvider: ExchangeDataProvider) {
    this.dataProvider = dataProvider;
    console.log('[StrategyEngine] Initialized.');
  }

  /**
   * Analyzes market data to find profitable arbitrage opportunities.
   * It iterates through a predefined list of strategy pairs, fetches prices and fees,
   * calculates the spread, and creates a trade opportunity if it's profitable.
   * @returns A promise that resolves to an array of trade opportunities.
   */
  public async findOpportunities(): Promise<ITradeOpportunity[]> {
    console.log('[StrategyEngine] Analyzing markets for opportunities...');
    const opportunities: ITradeOpportunity[] = [];

    for (const pair of STRATEGY_PAIRS) {
        const fetcherA = this.dataProvider.getFetcher(pair.exchangeA);
        const fetcherB = this.dataProvider.getFetcher(pair.exchangeB);
        const feeA = this.dataProvider.getFee(pair.exchangeA);
        const feeB = this.dataProvider.getFee(pair.exchangeB);

        if (!fetcherA || !fetcherB || feeA === undefined || feeB === undefined) {
            console.error(`[StrategyEngine] Could not find fetchers or fees for pair: ${pair.exchangeA}, ${pair.exchangeB}. Skipping.`);
            continue;
        }

        // Fetch price from the primary exchange
        const priceA = await fetcherA.fetchPrice(pair.symbol);

        // If the second fetcher is our mock, we must set its base price
        if (fetcherB instanceof MockFetcher) {
            fetcherB.setBasePrice(priceA);
        }

        const priceB = await fetcherB.fetchPrice(pair.symbol);

        // Determine buy/sell exchanges
        const buyExchange = priceA < priceB ? pair.exchangeA : pair.exchangeB;
        const sellExchange = priceA < priceB ? pair.exchangeB : pair.exchangeA;
        const buyPrice = Math.min(priceA, priceB);
        const sellPrice = Math.max(priceA, priceB);

        // Profitability calculation
        const spread = sellPrice - buyPrice;
        // NOTE: For this calculation, we assume a trade amount of 1 unit of the base currency.
        const tradeAmount = 1;
        const totalFees = (buyPrice * feeA) + (sellPrice * feeB);

        console.log(`[StrategyEngine] Analyzing ${pair.symbol} on ${pair.exchangeA} (${priceA}) vs ${pair.exchangeB} (${priceB}). Spread: ${spread.toFixed(2)}, Fees: ${totalFees.toFixed(2)}`);

        if (spread > totalFees) {
            const estimatedProfit = spread - totalFees;
            console.log(`[StrategyEngine] Profitable opportunity found! Profit: ${estimatedProfit.toFixed(2)}`);

            const opportunity: ITradeOpportunity = {
                type: 'Arbitrage',
                estimatedProfit,
                actions: [
                    {
                        action: 'Buy',
                        exchange: buyExchange,
                        pair: pair.symbol,
                        price: buyPrice,
                        amount: tradeAmount
                    },
                    {
                        action: 'Sell',
                        exchange: sellExchange,
                        pair: pair.symbol,
                        price: sellPrice,
                        amount: tradeAmount
                    }
                ]
            };
            opportunities.push(opportunity);
        }
    }

    return opportunities;
  }
}