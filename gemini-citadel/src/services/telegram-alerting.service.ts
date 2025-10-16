import TelegramBot from 'node-telegram-bot-api';
import logger from './logger.service';

export class TelegramAlertingService {
  private bot: TelegramBot;
  private chatId: string;

  constructor(token: string, chatId: string) {
    if (!token || !chatId) {
      throw new Error('Telegram token and chat ID must be provided.');
    }
    this.bot = new TelegramBot(token);
    this.chatId = chatId;
    logger.info('[TelegramAlertingService] Initialized.');
  }

  public async sendMessage(message: string): Promise<void> {
    try {
      await this.bot.sendMessage(this.chatId, message);
      logger.info(`[TelegramAlertingService] Message sent to chat ID ${this.chatId}`);
    } catch (error) {
      logger.error('[TelegramAlertingService] Error sending message:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }
}