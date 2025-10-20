import TelegramBot from 'node-telegram-bot-api';
import logger from './logger.service';
import { FiatConversionService } from './FiatConversionService';
import { ArbitrageOpportunity } from '../models/ArbitrageOpportunity';
import { IGlobalMarketMetrics } from './MarketIntelligenceService';

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
    // Assuming profit is in a USD-pegged stablecoin as per the architectural directive.
    let message = `🚀 Arbitrage Opportunity Found! Profit: ${profit.toFixed(
      6
    )} USDT`;

    const fiatConversionText =
      await this.fiatConversionService.getFiatConversion(profit, 'USD');

    message += fiatConversionText;

    await this.sendMessage(message);
  }

  public async sendMarketWeather(metrics: IGlobalMarketMetrics): Promise<void> {
    const { totalMarketCap, btcDominance, volume24h } = metrics;

    const message = `
      **Market Weather Report**
      -------------------------
      Total Market Cap: $${totalMarketCap.toLocaleString()}
      BTC Dominance: ${btcDominance.toFixed(2)}%
      24h Volume: $${volume24h.toLocaleString()}
    `;

    await this.sendMessage(message);
  }
}
