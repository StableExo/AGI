import { ExchangeDataProvider } from './ExchangeDataProvider';
import { ArbitrageOpportunity } from '../models/ArbitrageOpportunity';
import { ITradeAction } from '../models/ITradeAction';
import { MarketDataEvent } from '../models/MarketDataEvent';
import KafkaService from './KafkaService';
import logger from './logger.service';
import { ExecutionManager } from './ExecutionManager';

export class CexStrategyEngine {
  private readonly dataProvider: ExchangeDataProvider;
  private readonly executionManager: ExecutionManager;
  // State to hold the latest market data for each exchange and symbol
  private latestMarketData: Map<string, MarketDataEvent> = new Map();

  constructor(dataProvider: ExchangeDataProvider, executionManager: ExecutionManager) {
    this.dataProvider = dataProvider;
    this.executionManager = executionManager;
  }

  /**
   * Starts the engine to consume market data from Kafka.
   */
  public async start(): Promise<void> {
    logger.info('[CexStrategyEngine] Starting consumer...');
    // Subscribe to all raw market data topics using the correct RegExp format
    await KafkaService.subscribe(/^market-data\.raw\..*/, (message) => {
      if (message.value) {
        this.handleMarketData(message.value.toString());
      }
    });
  }

  /**
   * Parses the incoming message and triggers the arbitrage check.
   * @param messageValue The raw message string from Kafka.
   */
  private handleMarketData(messageValue: string): void {
    try {
      const event: MarketDataEvent = JSON.parse(messageValue);
      // For this PoC, we will assume the data is valid. In production, we'd validate.

      const key = `${event.exchange}:${event.symbol}`;

      // Before updating our state, we check for opportunities against the new data
      this.findArbitrage(event);

      // Update the state with the latest data
      this.latestMarketData.set(key, event);

    } catch (error) {
      logger.error('[CexStrategyEngine] Error processing Kafka message:', error);
    }
  }

  /**
   * Finds arbitrage opportunities by comparing a new market data event against the stored state.
   * @param newEvent The newly received MarketDataEvent.
   */
  private async findArbitrage(newEvent: MarketDataEvent): Promise<void> {
    // Iterate through all stored market data points
    for (const [key, storedEvent] of this.latestMarketData.entries()) {
      // Check if the symbol matches but the exchange is different
      if (newEvent.symbol === storedEvent.symbol && newEvent.exchange !== storedEvent.exchange) {

        // We have a pair to compare.
        // Let's call the new event 'A' and the stored event 'B'
        const tickerA = newEvent;
        const tickerB = storedEvent;

        const feeA = this.dataProvider.getCexFee(tickerA.exchange)!;
        const feeB = this.dataProvider.getCexFee(tickerB.exchange)!;

        // Scenario 1: Buy on B, Sell on A
        const profit1 = (tickerA.bid.price * (1 - feeA)) - (tickerB.ask.price * (1 + feeB));
        if (profit1 > 0) {
          const buyAction: ITradeAction = { action: 'BUY', exchange: tickerB.exchange, pair: tickerB.symbol, price: tickerB.ask.price, amount: 1 };
          const sellAction: ITradeAction = { action: 'SELL', exchange: tickerA.exchange, pair: tickerA.symbol, price: tickerA.bid.price, amount: 1 };
          const opportunity = new ArbitrageOpportunity(profit1, [buyAction, sellAction]);
          logger.info(`[CexStrategyEngine] Found opportunity: ${JSON.stringify(opportunity)}`);
          await this.executionManager.executeCexTrade(opportunity);
        }

        // Scenario 2: Buy on A, Sell on B
        const profit2 = (tickerB.bid.price * (1 - feeB)) - (tickerA.ask.price * (1 + feeA));
        if (profit2 > 0) {
          const buyAction: ITradeAction = { action: 'BUY', exchange: tickerA.exchange, pair: tickerA.symbol, price: tickerA.ask.price, amount: 1 };
          const sellAction: ITradeAction = { action: 'SELL', exchange: tickerB.exchange, pair: tickerB.symbol, price: tickerB.bid.price, amount: 1 };
          const opportunity = new ArbitrageOpportunity(profit2, [buyAction, sellAction]);
          logger.info(`[CexStrategyEngine] Found opportunity: ${JSON.stringify(opportunity)}`);
          await this.executionManager.executeCexTrade(opportunity);
        }
      }
    }
  }

  public async stop(): Promise<void> {
    // In a real implementation, we would gracefully stop the consumer.
    // The current KafkaService implementation does not expose a way to stop a specific subscription,
    // so this is a placeholder for now.
    logger.info('[CexStrategyEngine] Stopping consumer...');
  }
}
