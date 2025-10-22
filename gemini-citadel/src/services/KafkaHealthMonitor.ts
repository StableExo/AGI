import KafkaService from './KafkaService';
import logger from './logger.service';

/**
 * A basic health monitor for the Kafka service.
 * It checks the connection status of the Kafka client.
 */
export class KafkaHealthMonitor {

  /**
   * Checks the health of the Kafka connection.
   * @returns {Promise<boolean>} A promise that resolves to true if connected, false otherwise.
   */
  public async checkHealth(): Promise<boolean> {
    const isConnected = KafkaService.isConnected();
    if (isConnected) {
      logger.info('[KafkaHealthMonitor] Kafka connection is healthy.');
    } else {
      logger.error('[KafkaHealthMonitor] Kafka connection is down.');
    }
    return isConnected;
  }

  // Placeholder for future, more advanced monitoring
  public async monitorConsumerLag(): Promise<void> {
    logger.debug('[KafkaHealthMonitor] Consumer lag monitoring not yet implemented.');
  }
}
