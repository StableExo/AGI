export enum FundingRequestStatus {
  PENDING = 'PENDING',                  // Initial state, request has been made
  PROPOSED = 'PROPOSED',                // Transaction has been proposed to the user's wallet
  AWAITING_CONFIRMATION = 'AWAITING_CONFIRMATION', // User approved, waiting for on-chain confirmation
  CONFIRMED = 'CONFIRMED',              // Transaction confirmed on-chain
  REJECTED = 'REJECTED',                // User rejected the transaction in-wallet
  TIMED_OUT = 'TIMED_OUT',              // No on-chain confirmation within the timeout window
  FAILED = 'FAILED',                    // An error occurred during the process
}

export interface FundingRequest {
  id: string;
  exchange: string;
  asset: string;
  amount: string; // Using string for precision with large numbers
  status: FundingRequestStatus;
  proposeTxHash?: string; // The hash of the proposal transaction sent via WalletConnector
  confirmTxHash?: string; // The hash of the on-chain transaction
  createdAt: number;
  updatedAt: number;
}

export interface ITreasuryManager {
  /**
   * Initiates a request to fund an exchange from the Treasury.
   * This will trigger the Approval Gateway workflow.
   * @returns The ID of the newly created funding request.
   */
  requestFunding(exchange: string, asset: string, amount: string): Promise<string>;

  /**
   * A reporting mechanism to notify the human operator that profits
   * are ready for manual withdrawal from an exchange.
   */
  depositProfits(exchange: string, asset: string, amount: string): Promise<void>;

  /**
   * Retrieves the current status of a funding request.
   */
  getRequestStatus(id: string): Promise<FundingRequest | null>;

  /**
   * Fetches the balance of a specific asset from the treasury wallet.
   * @param asset The asset to check (e.g., "USDT").
   * @returns A promise that resolves to the formatted token balance as a number.
   */
  getTreasuryBalance(asset: string): Promise<number>;
}