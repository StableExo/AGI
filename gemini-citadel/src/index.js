"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppFactory_1 = require("./AppFactory");
const logger_service_1 = __importDefault(require("./services/logger.service"));
const main = async () => {
    logger_service_1.default.info('--- Starting Gemini Citadel Off-Chain Brain ---');
    try {
        const app = await AppFactory_1.AppFactory.create();
        await app.start(); // This will now run indefinitely
    }
    catch (error) {
        logger_service_1.default.error('--- A fatal error occurred during initialization ---', error);
        process.exit(1);
    }
};
main();
