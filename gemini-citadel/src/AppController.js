"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
require("dotenv/config");
const bot_config_1 = require("./config/bot.config");
const logger_service_1 = __importDefault(require("./services/logger.service"));
class AppController {
    constructor(dataProvider, executionManager, strategyEngine, flashbotsService, cexStrategyEngine, telegramAlertingService) {
        this.exchangeDataProvider = dataProvider;
        this.executionManager = executionManager;
        this.strategyEngine = strategyEngine;
        this.flashbotsService = flashbotsService;
        this.cexStrategyEngine = cexStrategyEngine;
        this.telegramAlertingService = telegramAlertingService;
    }
    async runDexCycle() {
        try {
            logger_service_1.default.info(`[AppController] Starting DEX analysis cycle...`);
            const opportunities = await this.strategyEngine.findOpportunities();
            if (opportunities.length > 0) {
                logger_service_1.default.info(`[AppController] Found ${opportunities.length} DEX opportunities. Executing...`);
                await Promise.all(opportunities.map(opp => this.executionManager.executeTrade(opp, process.env.FLASH_SWAP_CONTRACT_ADDRESS)));
            }
            else {
                logger_service_1.default.info(`[AppController] No DEX opportunities found in this cycle.`);
            }
            logger_service_1.default.info(`[AppController] DEX analysis cycle completed successfully.`);
        }
        catch (error) {
            logger_service_1.default.error(`[AppController] An error occurred during the DEX analysis cycle:`, error);
        }
    }
    async runCexCycle() {
        try {
            logger_service_1.default.info(`[AppController] Starting CEX analysis cycle...`);
            // For now, we'll hardcode the pairs to search for. In the future, this would be dynamic.
            const pairsToSearch = [{ base: 'BTC', quote: 'USDT' }];
            const opportunities = await this.cexStrategyEngine.findOpportunities(pairsToSearch);
            if (opportunities.length > 0) {
                logger_service_1.default.info(`[AppController] Found ${opportunities.length} CEX opportunities. Executing...`);
                await Promise.all(opportunities.map(opp => this.executionManager.executeCexTrade(opp)));
            }
            else {
                logger_service_1.default.info(`[AppController] No CEX opportunities found in this cycle.`);
            }
            logger_service_1.default.info(`[AppController] CEX analysis cycle completed successfully.`);
        }
        catch (error) {
            logger_service_1.default.error(`[AppController] An error occurred during the CEX analysis cycle:`, error);
        }
    }
    async start() {
        logger_service_1.default.info('[AppController] Starting main execution loop...');
        // Perform an immediate run on startup, then enter the loop.
        await this.runCexCycle(); // Prioritize CEX as per our new mission
        // await this.runDexCycle(); // We can disable the DEX cycle to focus on CEX
        setInterval(() => this.runCexCycle(), bot_config_1.botConfig.loopIntervalMs);
    }
}
exports.AppController = AppController;
