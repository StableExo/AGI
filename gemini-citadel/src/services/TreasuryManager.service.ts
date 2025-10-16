import { ITreasuryManager, FundingRequest, FundingRequestStatus } from '../interfaces/TreasuryManager.interface';
import { IWalletConnector } from '../interfaces/WalletConnector.interface';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';

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
    'USDC': { contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' }
};
const EXCHANGE_DEPOSIT_ADDRESSES = {
    'Binance': { 'USDC': '0x...BinanceDepositAddress' }
};

export class TreasuryManagerService implements ITreasuryManager {
  private fundingRequests: Map<string, FundingRequest> = new Map();
  private walletConnector: IWalletConnector;
  private onChainProvider: ethers.providers.JsonRpcProvider;

  constructor(walletConnector: IWalletConnector, rpcUrl: string) {
    this.walletConnector = walletConnector;
    this.onChainProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
  }

  public async requestFunding(exchange: string, asset: string, amount: string): Promise<string> {
    const id = uuidv4();
    const newRequest: FundingRequest = {
      id,
      exchange,
      asset,
      amount,
      status: FundingRequestStatus.PENDING,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.fundingRequests.set(id, newRequest);
    this.processFundingRequest(id); // Process asynchronously
    return id;
  }

  private async processFundingRequest(id: string): Promise<void> {
    const request = this.fundingRequests.get(id);
    if (!request) return;

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

      this.updateRequestStatus(id, FundingRequestStatus.PROPOSED, { proposeTxHash: txHash });

      // 2. Start on-chain monitoring and timeout
      this.monitorOnChain(id);
      this.startTimeout(id);

    } catch (error) {
      // This catches user rejection from the wallet or other proposal errors
      console.error(`Funding request ${id} failed during proposal:`, error);
      this.updateRequestStatus(id, FundingRequestStatus.REJECTED);
    }
  }

  private monitorOnChain(id: string): void {
    const request = this.fundingRequests.get(id);
    if (!request) return;

    console.log(`[${id}] Monitoring blockchain for transaction...`);
    // In a real implementation, this would involve setting up a listener
    // for transactions to the deposit address from the treasury wallet address.
    // For this architectural document, we simulate the logic.
    // Example: this.onChainProvider.on(filter, (log) => { ... });
    // Upon finding the matching transaction, we would call:
    // this.updateRequestStatus(id, FundingRequestStatus.CONFIRMED, { confirmTxHash: log.transactionHash });
  }

  private startTimeout(id: string): void {
    setTimeout(() => {
      const request = this.fundingRequests.get(id);
      if (request && request.status === FundingRequestStatus.PROPOSED) {
        console.log(`[${id}] Funding request timed out.`);
        this.updateRequestStatus(id, FundingRequestStatus.TIMED_OUT);
      }
    }, REQUEST_TIMEOUT_MS);
  }

  public async depositProfits(exchange: string, asset: string, amount: string): Promise<void> {
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

  public async getRequestStatus(id:string): Promise<FundingRequest | null> {
    return this.fundingRequests.get(id) || null;
  }

  private updateRequestStatus(id: string, status: FundingRequestStatus, data: Partial<FundingRequest> = {}): void {
    const request = this.fundingRequests.get(id);
    if (request) {
      request.status = status;
      request.updatedAt = Date.now();
      Object.assign(request, data);
      console.log(`[${id}] Status updated to ${status}`);
    }
  }
}