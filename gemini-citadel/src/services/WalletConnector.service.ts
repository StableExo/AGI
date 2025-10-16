import { IWalletConnector, ITransactionProposal, IERC20TransferProposal } from '../interfaces/WalletConnector.interface';
import { CoinbaseWalletSDK } from '@coinbase/wallet-sdk';
import { ethers } from 'ethers';

// --- Architectural Notes ---
// 1. SDK Initialization: The SDK will be initialized once with our app's information.
//    This instance will be managed internally by the service.
// 2. Provider: The SDK provides an EIP-1193 compliant provider, which can be wrapped
//    by ethers.js for easier interaction.
// 3. User Flow:
//    - `initialize()` will trigger the connection prompt in the user's browser/wallet.
//    - `proposeTransaction()` will trigger a signing request in the user's wallet.
//    - The user must manually approve/reject the request in their wallet.
// 4. Security: This service will never handle private keys. All signing happens
//    inside the user's secure Coinbase Wallet environment.

const APP_NAME = 'Gemini Citadel';
const APP_LOGO_URL = 'https://example.com/logo.png'; // Placeholder
const DEFAULT_CHAIN_ID = 1; // Mainnet

export class WalletConnectorService implements IWalletConnector {
  private sdk: CoinbaseWalletSDK | null = null;
  private provider: ethers.providers.Web3Provider | null = null;
  private userAddress: string | null = null;

  public async initialize(): Promise<void> {
    if (this.sdk) {
      console.log('WalletConnectorService already initialized.');
      return;
    }

    this.sdk = new CoinbaseWalletSDK({
      appName: APP_NAME,
      appLogoUrl: APP_LOGO_URL,
      darkMode: true,
    });

    const web3Provider = this.sdk.makeWeb3Provider(
      `https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID`, // Placeholder RPC URL
      DEFAULT_CHAIN_ID
    );

    this.provider = new ethers.providers.Web3Provider(web3Provider);

    // Request account access
    const accounts = await this.provider.send('eth_requestAccounts', []);
    if (accounts.length > 0) {
      this.userAddress = accounts[0];
      console.log(`Connected to wallet: ${this.userAddress}`);
    } else {
      throw new Error('Wallet connection denied.');
    }
  }

  public getAddress(): string | null {
    return this.userAddress;
  }

  public async proposeTransaction(proposal: ITransactionProposal): Promise<string> {
    if (!this.provider || !this.userAddress) {
      throw new Error('Wallet not connected. Please initialize first.');
    }

    const signer = this.provider.getSigner();

    const tx = {
      from: this.userAddress,
      to: proposal.to,
      value: proposal.value,
      data: proposal.data,
    };

    // This will open the confirmation dialog in the user's Coinbase Wallet
    const txResponse = await signer.sendTransaction(tx);
    return txResponse.hash;
  }

  public async proposeERC20Transfer(proposal: IERC20TransferProposal): Promise<string> {
    if (!this.provider || !this.userAddress) {
        throw new Error('Wallet not connected. Please initialize first.');
    }

    const signer = this.provider.getSigner();
    const erc20Abi = [
        "function transfer(address to, uint256 amount) returns (bool)"
    ];

    const contract = new ethers.Contract(proposal.contractAddress, erc20Abi, signer);

    // This will open the ERC20 transfer confirmation dialog in the user's wallet
    const txResponse = await contract.transfer(proposal.to, proposal.amount);
    return txResponse.hash;
  }

  public async disconnect(): Promise<void> {
    if (this.sdk) {
      this.sdk.disconnect();
      this.sdk = null;
      this.provider = null;
      this.userAddress = null;
      console.log('Wallet disconnected.');
    }
  }
}