"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramAlertingService = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const logger_service_1 = __importDefault(require("./logger.service"));
class TelegramAlertingService {
    constructor(token, chatId) {
        if (!token || !chatId) {
            throw new Error('Telegram token and chat ID must be provided.');
        }
        this.bot = new node_telegram_bot_api_1.default(token);
        this.chatId = chatId;
        logger_service_1.default.info('[TelegramAlertingService] Initialized.');
    }
    async sendMessage(message) {
        try {
            await this.bot.sendMessage(this.chatId, message);
            logger_service_1.default.info(`[TelegramAlertingService] Message sent to chat ID ${this.chatId}`);
        }
        catch (error) {
            logger_service_1.default.error('[TelegramAlertingService] Error sending message:', error);
            throw error; // Re-throw the error to be handled by the caller
        }
    }
}
exports.TelegramAlertingService = TelegramAlertingService;
