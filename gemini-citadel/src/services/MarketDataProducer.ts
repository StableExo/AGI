import { z } from 'zod';
import { MarketDataEvent } from '../models/MarketDataEvent';
import KafkaService from './KafkaService';
import logger from './logger.service';
import { v4 as uuidv4 } from 'uuid';

// Zod schema for MarketDataEvent validation
export const MarketDataEventSchema = z.object({
  schema_version: z.literal('2.0.0'),
  event_id: z.string().uuid(),
  exchange: z.enum(['btcc', 'kraken', 'coinbase']),
  symbol: z.string(),
  bid: z.object({
    price: z.number(),
    quantity: z.number(),
    liquidity: z.number(),
  }),
  ask: z.object({
    price: z.number(),
    quantity: z.number(),
    liquidity: z.number(),
  }),
  spread: z.number(),
  spread_bps: z.number(),
  volume_24h: z.number(),
  funding_rate: z.number().optional(),
  exchange_timestamp: z.number(),
  processing_timestamp: z.number(),
  latency_ms: z.number(),
  sequence_id: z.number(),
  is_snapshot: z.boolean(),
});

export abstract class MarketDataProducer {
  protected exchange: 'btcc' | 'kraken' | 'coinbase';
  private interval: NodeJS.Timeout | null = null;

  constructor(exchange: 'btcc' | 'kraken' | 'coinbase') {
    this.exchange = exchange;
  }

  protected async publish(eventData: Omit<MarketDataEvent, 'event_id' | 'schema_version'>): Promise<void> {
    const event: MarketDataEvent = {
      ...eventData,
      event_id: uuidv4(),
      schema_version: '2.0.0',
    };

    try {
      // 1. Validate the event against the schema
      MarketDataEventSchema.parse(event);

      // 2. Define the topic
      const topic = `market-data.raw.${this.exchange}.${event.symbol.toLowerCase().replace('/', '-')}`;

      // 3. Serialize and send the message
      const message = JSON.stringify(event);
      await KafkaService.sendMessage(topic, message);

      logger.debug(`Published event ${event.event_id} to topic ${topic}`);

    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(`Schema validation failed for event ${event.event_id}:`, error.errors);
      } else {
        logger.error(`Failed to publish market data event ${event.event_id}:`, error);
      }
    }
  }

  // Abstract method to be implemented by specific exchange producers
  protected abstract fetchData(): Promise<void>;

  async start(fetchIntervalMs: number = 10000): Promise<void> {
    logger.info(`Starting ${this.exchange} market data producer.`);
    await this.fetchData(); // Initial fetch
    this.interval = setInterval(() => this.fetchData(), fetchIntervalMs);
  }

  async stop(): Promise<void> {
    logger.info(`Stopping ${this.exchange} market data producer.`);
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}
