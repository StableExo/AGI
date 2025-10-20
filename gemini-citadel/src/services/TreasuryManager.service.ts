import { ITreasuryManager, FundingRequest, FundingRequestStatus } from '../interfaces/TreasuryManager.interface';
import { JsonRpcProvider, Contract, formatUnits, Interface } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { botConfig } from '../config/bot.config';
import logger from './logger.service';
import { IWalletConnector } from '../interfaces/WalletConnector.interface';
import { ITelegramAlertingService } from '../interfaces/TelegramAlerting.interface';
import { treasuryConfig } from '../config/treasury.config';


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

export class TreasuryManagerService implements ITreasuryManager {
  private fundingRequests: Map<string, FundingRequest> = new Map();
  private onChainProvider: JsonRpcProvider;
  private walletConnector: IWalletConnector;
  private alertingService: ITelegramAlertingService;


  constructor(
    walletConnector: IWalletConnector,
    alertingService: ITelegramAlertingService,
    rpcUrl: string
  ) {
    this.onChainProvider = new JsonRpcProvider(rpcUrl);
    this.walletConnector = walletConnector;
    this.alertingService = alertingService;
  }

  public async getTreasuryBalance(asset: string): Promise<number> {
    logger.info(`[TreasuryManager] Checking balance for ${asset}...`);
    const assetInfo = treasuryConfig.assets[asset as keyof typeof treasuryConfig.assets];
    if (!assetInfo) {
      throw new Error(`Asset ${asset} not configured.`);
    }

    const { contractAddress, decimals } = assetInfo;
    const walletAddress = botConfig.treasury.walletAddress;

    const erc20Abi = [
      "function balanceOf(address account) view returns (uint256)"
    ];

    const contract = new Contract(contractAddress, erc20Abi, this.onChainProvider);
    const balance = await contract.balanceOf(walletAddress);

    const formattedBalance = parseFloat(formatUnits(balance, decimals));
    logger.info(`[TreasuryManager] Treasury wallet balance for ${asset}: ${formattedBalance.toFixed(2)}`);
    return formattedBalance;
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
      const depositAddress = treasuryConfig.exchanges[request.exchange]?.[request.asset];
      const assetConfig = treasuryConfig.assets[request.asset as keyof typeof treasuryConfig.assets];
      if (!depositAddress || !assetConfig) {
        throw new Error(`Configuration not found for ${request.asset} on ${request.exchange}`);
      }

      const txHash = await this.walletConnector.proposeERC20Transfer({
        contractAddress: assetConfig.contractAddress,
        to: depositAddress,
        amount: request.amount,
      });

      this.updateRequestStatus(id, FundingRequestStatus.PROPOSED, { proposeTxHash: txHash });

      // 2. Start on-chain monitoring, which now includes timeout logic.
      this.monitorOnChain(id);

    } catch (error) {
      // This catches user rejection from the wallet or other proposal errors
      console.error(`Funding request ${id} failed during proposal:`, error);
      this.updateRequestStatus(id, FundingRequestStatus.REJECTED);
    }
  }

  private monitorOnChain(id: string): void {
    const request = this.fundingRequests.get(id);
    if (!request) return;

    logger.info(`[TreasuryManager] [${id}] Beginning on-chain monitoring...`);

    const assetConfig = treasuryConfig.assets[request.asset as keyof typeof treasuryConfig.assets];
    const depositAddress = treasuryConfig.exchanges[request.exchange]?.[request.asset];
    const treasuryAddress = botConfig.treasury.walletAddress;

    if (!assetConfig || !depositAddress) {
      logger.error(`[TreasuryManager] [${id}] Missing configuration for on-chain monitoring.`);
      this.updateRequestStatus(id, FundingRequestStatus.FAILED, { error: 'Configuration missing' });
      return;
    }

    // Define the ERC20 Transfer event signature to filter logs
    const erc20Interface = new Interface([
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    ]);
    const eventName = 'Transfer';
    const filter = {
        address: assetConfig.contractAddress,
        topics: erc20Interface.getEventTopics(eventName, [
            treasuryAddress,
            depositAddress
        ])
    };

    let pollCount = 0;
    const maxPolls = 60; // Poll for 15 minutes (60 polls * 15 seconds)
    const pollInterval = 15000; // 15 seconds

    const poll = setInterval(async () => {
      if (pollCount >= maxPolls) {
        clearInterval(poll);
        // This check is to ensure we don't overwrite a CONFIRMED status
        // if the confirmation happened on the very last poll.
        const currentRequest = this.fundingRequests.get(id);
        if (currentRequest?.status === FundingRequestStatus.PROPOSED) {
          logger.warn(`[TreasuryManager] [${id}] On-chain monitoring timed out.`);
          this.updateRequestStatus(id, FundingRequestStatus.TIMED_OUT);
        }
        return;
      }

      try {
        const logs = await this.onChainProvider.getLogs(filter);
        if (logs.length > 0) {
          // Found a matching transaction.
          // In a multi-tx scenario, we might need to verify the amount,
          // but for this protocol, the first matching log is sufficient proof.
          const log = logs[0];
          const parsedLog = erc20Interface.parseLog(log);

          if (parsedLog && parsedLog.args.value.toString() === request.amount) {
              logger.info(`[TreasuryManager] [${id}] On-chain transaction confirmed. TxHash: ${log.transactionHash}`);
              this.updateRequestStatus(id, FundingRequestStatus.CONFIRMED, { confirmTxHash: log.transactionHash });
              clearInterval(poll);
          }
        }
      } catch (error) {
        logger.error(`[TreasuryManager] [${id}] Error during on-chain log polling:`, error);
        // We do not fail the request here, to allow for recovery from transient RPC errors.
      }

      pollCount++;
    }, pollInterval);
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
      // Prevent regression of status
      if (request.status === FundingRequestStatus.CONFIRMED || request.status === FundingRequestStatus.FAILED) {
        logger.warn(`[TreasuryManager] [${id}] Attempted to update status of a terminal request. Current: ${request.status}, New: ${status}`);
        return;
      }

      request.status = status;
      request.updatedAt = Date.now();
      Object.assign(request, data);

      const logContext = {
          requestId: id,
          exchange: request.exchange,
          asset: request.asset,
          amount: request.amount,
          newStatus: status
      };

      if (status === FundingRequestStatus.FAILED) {
        logger.error(`[TreasuryManager] Funding request failed.`, { ...logContext, error: (data as any).error });
        this.alertingService.sendAlert(
          `Critical Alert: Funding Request Failed`,
          `Request ID: ${id}\nExchange: ${request.exchange}\nAsset: ${request.asset}\nAmount: ${request.amount}\nReason: ${ (data as any).error || 'Unknown'}`
        );
      } else if (status === FundingRequestStatus.REJECTED || status === FundingRequestStatus.TIMED_OUT) {
        logger.warn(`[TreasuryManager] Funding request did not complete.`, logContext);
      } else {
        logger.info(`[TreasuryManager] Funding request status updated.`, logContext);
      }
    }
  }
}