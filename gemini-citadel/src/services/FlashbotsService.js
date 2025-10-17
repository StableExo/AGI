"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlashbotsService = void 0;
const ethers_provider_bundle_1 = require("@flashbots/ethers-provider-bundle");
const ethers_1 = require("ethers");
const flashbots_config_1 = require("../config/flashbots.config");
const logger_service_1 = __importDefault(require("./logger.service"));
class FlashbotsService {
    constructor(provider, executionSigner) {
        this.provider = provider;
        this.executionSigner = executionSigner;
        this.flashbotsProvider = null;
        if (!process.env.FLASHBOTS_AUTH_KEY) {
            throw new Error('FLASHBOTS_AUTH_KEY must be set in the environment.');
        }
        this.authSigner = new ethers_1.Wallet(process.env.FLASHBOTS_AUTH_KEY);
    }
    async initialize() {
        const network = await this.provider.getNetwork();
        const chainId = Number(network.chainId);
        if (!flashbots_config_1.flashbotsUrls[chainId]) {
            logger_service_1.default.warn(`[FlashbotsService] Flashbots is not supported on chain ID ${chainId}. The service will be disabled.`);
            this.flashbotsProvider = null;
            return;
        }
        this.flashbotsProvider = await ethers_provider_bundle_1.FlashbotsBundleProvider.create(this.provider, this.authSigner, flashbots_config_1.flashbotsUrls[chainId]);
    }
    async sendBundle(bundle, targetBlock) {
        if (!this.flashbotsProvider) {
            throw new Error('FlashbotsService is not initialized.');
        }
        const signedBundle = await this.flashbotsProvider.signBundle(bundle);
        logger_service_1.default.info('Signed bundle:', signedBundle);
        const simulation = await this.flashbotsProvider.simulate(signedBundle, targetBlock);
        logger_service_1.default.info('Simulation result:', simulation);
        if ('error' in simulation || simulation.results.some(tx => 'revert' in tx)) {
            logger_service_1.default.error('Flashbots bundle simulation failed:', simulation);
            return false;
        }
        const flashbotsTransaction = await this.flashbotsProvider.sendBundle(bundle, targetBlock);
        if ('error' in flashbotsTransaction) {
            logger_service_1.default.error('Error sending Flashbots bundle:', flashbotsTransaction.error.message);
            return false;
        }
        const resolution = await flashbotsTransaction.wait();
        if (resolution === ethers_provider_bundle_1.FlashbotsBundleResolution.BundleIncluded) {
            logger_service_1.default.info('Flashbots bundle included in block:', targetBlock);
            return true;
        }
        else if (resolution === ethers_provider_bundle_1.FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
            logger_service_1.default.warn('Flashbots bundle not included in block:', targetBlock);
            return false;
        }
        else if (resolution === ethers_provider_bundle_1.FlashbotsBundleResolution.AccountNonceTooHigh) {
            logger_service_1.default.warn('Flashbots bundle failed due to nonce too high.');
            return false;
        }
        return false;
    }
}
exports.FlashbotsService = FlashbotsService;
