import { Kafka, logLevel, Producer, Consumer, KafkaMessage } from 'kafkajs'
import logger from './logger.service'

class KafkaService {
  private kafka: Kafka
  private producer: Producer
  private consumer: Consumer
  private isConnectedState: boolean = false

  constructor() {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID,
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      logLevel: logLevel.INFO,
    })

    this.producer = this.kafka.producer()
    this.consumer = this.kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID || 'arbitrage-engine-1' })

    // Use KafkaJS events to track connection status
    this.producer.on('producer.connect', () => {
        logger.info('Kafka producer connected.');
        this.updateConnectionStatus();
    });
    this.producer.on('producer.disconnect', () => {
        logger.warn('Kafka producer disconnected.');
        this.isConnectedState = false;
    });
    this.consumer.on('consumer.connect', () => {
        logger.info('Kafka consumer connected.');
        this.updateConnectionStatus();
    });
    this.consumer.on('consumer.disconnect', () => {
        logger.warn('Kafka consumer disconnected.');
        this.isConnectedState = false;
    });
  }

  private updateConnectionStatus(): void {
    // A more robust check would verify both producer and consumer are connected
    this.isConnectedState = true;
  }

  public isConnected(): boolean {
    return this.isConnectedState;
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect()
      await this.consumer.connect()
      logger.info('Successfully connected to Kafka')
    } catch (error) {
      logger.error('Failed to connect to Kafka:', error)
      this.isConnectedState = false;
      throw error
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect()
      await this.consumer.disconnect()
      logger.info('Successfully disconnected from Kafka')
    } catch (error) {
      logger.error('Failed to disconnect from Kafka:', error)
    }
  }

  async sendMessage(topic: string, message: string): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: message }],
      })
    } catch (error) {
      logger.error(`Failed to send message to topic ${topic}:`, error)
    }
  }

  async subscribe(topic: RegExp, callback: (message: KafkaMessage) => void): Promise<void> {
    try {
      await this.consumer.subscribe({ topic, fromBeginning: true })
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          callback(message)
        },
      })
    } catch (error) {
      logger.error(`Failed to subscribe to topic ${topic}:`, error)
    }
  }
}

export default new KafkaService()
