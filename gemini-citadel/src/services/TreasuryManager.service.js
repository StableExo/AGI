"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreasuryManagerService = void 0;
const TreasuryManager_interface_1 = require("../interfaces/TreasuryManager.interface");
const ethers_1 = require("ethers");
const uuid_1 = require("uuid");
const bot_config_1 = require("../config/bot.config");
const logger_service_1 = __importDefault(require("./logger.service"));
// --- Architectural Notes ---
// 1. State Management: The service will maintain an in-memory map of all active
//    funding requests. For a production system, this would be a persistent database.
// 2. On-Chain Monitoring: The core of the feedback loop. After proposing a tx,
//    this service will listen for an on-chain transaction that matches the proposal.
//    It will use a provider (e.g., from Infura/Alchemy) for this monitoring.
// 3. Decoupling: The TreasuryManager is decoupled from the WalletConnector via
//    interfaces. It doesn't know the specifics of the wallet connection, only
//    that it can propose transactions.
// 4. Timeout Mechanism: A crucial part of the design. A `setTimeout` will be
//    initiated for each request to handle cases where the user ignores the request.
// 5. Asset Configuration: The service will need a configuration mapping assets
//    (e.g., "USDC") to their contract addresses and CEX deposit addresses.
const REQUEST_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
// Placeholder for asset and exchange configuration
const ASSET_CONFIG = {
    'USDT': { contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    'USDC': { contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 }
};
const EXCHANGE_DEPOSIT_ADDRESSES = {
    'Binance': { 'USDC': '0x...BinanceDepositAddress' }
};
class TreasuryManagerService {
    constructor(walletConnector, rpcUrl) {
        this.fundingRequests = new Map();
        this.onChainProvider = new ethers_1.JsonRpcProvider(rpcUrl);
        this.walletConnector = walletConnector;
    }
    async getTreasuryBalance(asset) {
        logger_service_1.default.info(`[TreasuryManager] Checking balance for ${asset}...`);
        const assetInfo = ASSET_CONFIG[asset];
        if (!assetInfo) {
            throw new Error(`Asset ${asset} not configured.`);
        }
        const { contractAddress, decimals } = assetInfo;
        const walletAddress = bot_config_1.botConfig.treasury.walletAddress;
        const erc20Abi = [
            "function balanceOf(address account) view returns (uint256)"
        ];
        const contract = new ethers_1.Contract(contractAddress, erc20Abi, this.onChainProvider);
        const balance = await contract.balanceOf(walletAddress);
        const formattedBalance = parseFloat((0, ethers_1.formatUnits)(balance, decimals));
        logger_service_1.default.info(`[TreasuryManager] Treasury wallet balance for ${asset}: ${formattedBalance.toFixed(2)}`);
        return formattedBalance;
    }
    async requestFunding(exchange, asset, amount) {
        const id = (0, uuid_1.v4)();
        const newRequest = {
            id,
            exchange,
            asset,
            amount,
            status: TreasuryManager_interface_1.FundingRequestStatus.PENDING,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        this.fundingRequests.set(id, newRequest);
        this.processFundingRequest(id); // Process asynchronously
        return id;
    }
    async processFundingRequest(id) {
        const request = this.fundingRequests.get(id);
        if (!request)
            return;
        try {
            // 1. Propose transaction via WalletConnector
            const depositAddress = EXCHANGE_DEPOSIT_ADDRESSES[request.exchange]?.[request.asset];
            const assetConfig = ASSET_CONFIG[request.asset];
            if (!depositAddress || !assetConfig) {
                throw new Error(`Configuration not found for ${request.asset} on ${request.exchange}`);
            }
            const txHash = await this.walletConnector.proposeERC20Transfer({
                contractAddress: assetConfig.contractAddress,
                to: depositAddress,
                amount: request.amount,
            });
            this.updateRequestStatus(id, TreasuryManager_interface_1.FundingRequestStatus.PROPOSED, { proposeTxHash: txHash });
            // 2. Start on-chain monitoring and timeout
            this.monitorOnChain(id);
            this.startTimeout(id);
        }
        catch (error) {
            // This catches user rejection from the wallet or other proposal errors
            console.error(`Funding request ${id} failed during proposal:`, error);
            this.updateRequestStatus(id, TreasuryManager_interface_1.FundingRequestStatus.REJECTED);
        }
    }
    monitorOnChain(id) {
        const request = this.fundingRequests.get(id);
        if (!request)
            return;
        console.log(`[${id}] Monitoring blockchain for transaction...`);
        // In a real implementation, this would involve setting up a listener
        // for transactions to the deposit address from the treasury wallet address.
        // For this architectural document, we simulate the logic.
        // Example: this.onChainProvider.on(filter, (log) => { ... });
        // Upon finding the matching transaction, we would call:
        // this.updateRequestStatus(id, FundingRequestStatus.CONFIRMED, { confirmTxHash: log.transactionHash });
    }
    startTimeout(id) {
        setTimeout(() => {
            const request = this.fundingRequests.get(id);
            if (request && request.status === TreasuryManager_interface_1.FundingRequestStatus.PROPOSED) {
                console.log(`[${id}] Funding request timed out.`);
                this.updateRequestStatus(id, TreasuryManager_interface_1.FundingRequestStatus.TIMED_OUT);
            }
        }, REQUEST_TIMEOUT_MS);
    }
    async depositProfits(exchange, asset, amount) {
        // This is a notification mechanism. In a real system, this might trigger
        // a Telegram/email alert to the human operator.
        console.log(`
      [PROFIT NOTIFICATION]
      Action Required: Manual Withdrawal
      ---------------------------------
      Exchange: ${exchange}
      Asset:    ${asset}
      Amount:   ${amount}
      ---------------------------------
      Please withdraw the specified amount from the exchange to the Treasury wallet.
    `);
    }
    async getRequestStatus(id) {
        return this.fundingRequests.get(id) || null;
    }
    updateRequestStatus(id, status, data = {}) {
        const request = this.fundingRequests.get(id);
        if (request) {
            request.status = status;
            request.updatedAt = Date.now();
            Object.assign(request, data);
            console.log(`[${id}] Status updated to ${status}`);
        }
    }
}
exports.TreasuryManagerService = TreasuryManagerService;
