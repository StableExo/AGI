"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppFactory = void 0;
const ethers_1 = require("ethers");
const AppController_1 = require("./AppController");
const strategy_service_1 = require("./services/strategy.service");
const ExchangeDataProvider_1 = require("./services/ExchangeDataProvider");
const ExecutionManager_1 = require("./services/ExecutionManager");
const FlashbotsService_1 = require("./services/FlashbotsService");
const CexStrategyEngine_1 = require("./services/CexStrategyEngine");
const telegram_alerting_service_1 = require("./services/telegram-alerting.service");
const bot_config_1 = require("./config/bot.config");
const logger_service_1 = __importDefault(require("./services/logger.service"));
// Import CEX protocol modules
const CcxtFetcher_1 = require("./protocols/CcxtFetcher"); // Our new generic fetcher
class AppFactory {
    static async create() {
        logger_service_1.default.info('[AppFactory] Initializing application...');
        this.validateEnvVars();
        // --- Core Infrastructure Initialization ---
        const provider = new ethers_1.JsonRpcProvider(process.env.RPC_URL);
        const executionSigner = new ethers_1.Wallet(process.env.EXECUTION_PRIVATE_KEY, provider);
        // --- Service Initialization ---
        const dataProvider = new ExchangeDataProvider_1.ExchangeDataProvider([]); // Start with an empty provider
        const flashbotsService = new FlashbotsService_1.FlashbotsService(provider, executionSigner);
        await flashbotsService.initialize();
        const executionManager = new ExecutionManager_1.ExecutionManager(flashbotsService, executionSigner, dataProvider);
        const strategyEngine = new strategy_service_1.StrategyEngine(dataProvider); // For DEX
        const cexStrategyEngine = new CexStrategyEngine_1.CexStrategyEngine(dataProvider); // For CEX
        const telegramAlertingService = new telegram_alerting_service_1.TelegramAlertingService(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID);
        // --- Protocol Initialization ---
        for (const exchangeConfig of bot_config_1.botConfig.exchanges) {
            if (exchangeConfig.enabled) {
                switch (exchangeConfig.type) {
                    case 'CEX':
                        let cexFetcher;
                        switch (exchangeConfig.name) {
                            case 'binance':
                            case 'kraken':
                            case 'coinbase':
                                cexFetcher = new CcxtFetcher_1.CcxtFetcher(exchangeConfig.name, exchangeConfig.apiKey, exchangeConfig.apiSecret);
                                break;
                            default:
                                logger_service_1.default.warn(`[AppFactory] Unknown or unsupported CEX exchange: ${exchangeConfig.name}. Skipping.`);
                                continue; // Skip to the next exchange
                        }
                        dataProvider.registerCexFetcher(exchangeConfig.name, cexFetcher, exchangeConfig.fee);
                        // Executor integration will be handled later for all CEXs
                        break;
                    case 'DEX':
                        // Current DEX logic can remain here if needed
                        break;
                    default:
                        logger_service_1.default.warn(`[AppFactory] Unknown exchange type: ${exchangeConfig.type}. Skipping.`);
                        continue;
                }
            }
        }
        logger_service_1.default.info('[AppFactory] Initialization complete.');
        return new AppController_1.AppController(dataProvider, executionManager, strategyEngine, flashbotsService, cexStrategyEngine, telegramAlertingService);
    }
    static validateEnvVars() {
        if (!process.env.RPC_URL)
            throw new Error('RPC_URL must be set.');
        if (!process.env.EXECUTION_PRIVATE_KEY)
            throw new Error('EXECUTION_PRIVATE_KEY must be set.');
        // Flashbots may not be required for CEX-only operation, but we leave it for now.
        if (!process.env.FLASHBOTS_AUTH_KEY)
            throw new Error('FLASHBOTS_AUTH_KEY must be set.');
        if (!process.env.FLASH_SWAP_CONTRACT_ADDRESS)
            throw new Error('FLASH_SWAP_CONTRACT_ADDRESS must be set.');
        // Telegram alerting credentials
        if (!process.env.TELEGRAM_BOT_TOKEN)
            throw new Error('TELEGRAM_BOT_TOKEN must be set.');
        if (!process.env.TELEGRAM_CHAT_ID)
            throw new Error('TELEGRAM_CHAT_ID must be set.');
    }
}
exports.AppFactory = AppFactory;
