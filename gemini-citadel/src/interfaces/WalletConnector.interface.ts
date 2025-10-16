export interface ITransactionProposal {
  to: string;          // The recipient address (e.g., CEX deposit address)
  value: string;       // The amount of ETH/native currency to send, in wei
  data?: string;        // Optional data for contract interactions (e.g., ERC20 transfer)
  from?: string;        // The sender address (our Treasury wallet)
}

export interface IERC20TransferProposal {
  to: string;          // The CEX deposit address
  contractAddress: string; // The address of the ERC20 token contract
  amount: string;      // The amount of the token to send, in its smallest unit
}

export interface IWalletConnector {
  /**
   * Proposes a native currency (e.g., ETH) transaction to the user's wallet.
   * @param proposal The details of the transaction to be proposed.
   * @returns A promise that resolves with a transaction hash if approved,
   *          or rejects if the user denies the request.
   *          **Note:** Per our protocol, we will not use the returned hash directly.
   *          We will rely on on-chain monitoring.
   */
  proposeTransaction(proposal: ITransactionProposal): Promise<string>;

  /**
   * Proposes an ERC20 token transfer to the user's wallet.
   * @param proposal The details of the ERC20 transfer.
   * @returns A promise that resolves with a transaction hash if approved,
   *          or rejects if denied.
   */
  proposeERC20Transfer(proposal: IERC20TransferProposal): Promise<string>;

  /**
   * Initializes the connection to the wallet.
   */
  initialize(): Promise<void>;

  /**
   * Disconnects from the wallet.
   */
  disconnect(): Promise<void>;

  /**
   * Returns the connected wallet address.
   */
  getAddress(): string | null;
}