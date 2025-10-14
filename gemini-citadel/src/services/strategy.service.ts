import { ExchangeDataProvider } from './ExchangeDataProvider';
import { ITradeOpportunity } from '../interfaces/ITradeOpportunity';

export class StrategyEngine {
  private dataProvider: ExchangeDataProvider;

  constructor(dataProvider: ExchangeDataProvider) {
    this.dataProvider = dataProvider;
    console.log('[StrategyEngine] Initialized.');
  }

  /**
   * Analyzes market data to find profitable opportunities.
   *
   * For this phase, this method returns a hardcoded, simulated opportunity
   * to verify that the "Log-Only" execution pipeline is working correctly.
   *
   * @returns A promise that resolves to an array of trade opportunities.
   */
  public async findOpportunities(): Promise<ITradeOpportunity[]> {
    console.log('[StrategyEngine] Analyzing markets for opportunities...');

    const btcturkFetcher = this.dataProvider.getFetcher('btcturk');

    // If the BTCC fetcher is present, create a sample opportunity for logging.
    if (btcturkFetcher) {
      console.log('[StrategyEngine] Simulating a trade opportunity for verification...');

      // In a real scenario, we would fetch prices from two exchanges.
      // const priceOnExchangeA = await fetcherA.fetchPrice('BTC/USDT');
      // const priceOnExchangeB = await fetcherB.fetchPrice('BTC/USDT');

      const simulatedOpportunity: ITradeOpportunity = {
        type: 'Arbitrage',
        estimatedProfit: 25.50,
        actions: [
          {
            action: 'Buy',
            exchange: 'btcturk', // The protocol name must match the one registered in the manager
            pair: 'BTC/USDT',
            price: 50000.00,
            amount: 0.1
          },
          {
            action: 'Sell',
            exchange: 'uniswap_v3', // A hypothetical second exchange
            pair: 'BTC/USDT',
            price: 50255.00,
            amount: 0.1
          }
        ]
      };

      // NOTE: This currently creates a duplicate log entry because the ExecutionManager
      // iterates over actions. The BtccOrderBuilder will log once for each action that
      // matches its protocol. This will be refined later. For now, we expect one log.
      return [simulatedOpportunity];
    }

    return [];
  }
}