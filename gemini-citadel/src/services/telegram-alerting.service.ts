import TelegramBot from 'node-telegram-bot-api';
import logger from './logger.service';
import { FiatConversionService } from './FiatConversionService';
import { ArbitrageOpportunity } from '../models/ArbitrageOpportunity';

export class TelegramAlertingService {
  private bot: TelegramBot;
  private chatId: string;
  private fiatConversionService: FiatConversionService;

  constructor(
    token: string,
    chatId: string,
    fiatConversionService: FiatConversionService
  ) {
    if (!token || !chatId) {
      throw new Error('Telegram token and chat ID must be provided.');
    }
    this.bot = new TelegramBot(token);
    this.chatId = chatId;
    this.fiatConversionService = fiatConversionService;
    logger.info('[TelegramAlertingService] Initialized.');
  }

  public async sendMessage(message: string): Promise<void> {
    try {
      await this.bot.sendMessage(this.chatId, message);
      logger.info(
        `[TelegramAlertingService] Message sent to chat ID ${this.chatId}`
      );
    } catch (error) {
      logger.error('[TelegramAlertingService] Error sending message:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }

  public async sendArbitrageOpportunity(
    opportunity: ArbitrageOpportunity
  ): Promise<void> {
    const profit = opportunity.profit;
    let message = `🚀 Arbitrage Opportunity Found! Profit: ${profit.toFixed(
      8
    )} ETH`;

    try {
      const ticker = await this.fiatConversionService.getTicker();
      const usdValue = ticker['USD'].last * profit;
      const eurValue = ticker['EUR'].last * profit;
      const jpyValue = ticker['JPY'].last * profit;

      message += `\n💰 Fiat Value:
      - ${usdValue.toFixed(2)} USD
      - ${eurValue.toFixed(2)} EUR
      - ${jpyValue.toFixed(2)} JPY`;
    } catch (error) {
      logger.error(
        '[TelegramAlertingService] Could not fetch fiat conversions for opportunity alert.',
        error
      );
    }

    await this.sendMessage(message);
  }
}
