import {
  JsonRpcProvider,
  TransactionRequest,
  TransactionResponse,
  TransactionReceipt,
  Wallet,
} from "ethers";
import { IGasStrategy } from "../models/IGasStrategy";
import { ExecutionStrategy } from "../models/ExecutionStrategy";
import { botConfig } from "../config/bot.config";

export class TransactionService {
  private provider: JsonRpcProvider;
  private gasStrategy: IGasStrategy;
  private wallet: Wallet;

  constructor(gasStrategy: IGasStrategy) {
    this.provider = new JsonRpcProvider(botConfig.treasury.rpcUrl);
    this.gasStrategy = gasStrategy;
    // This is a placeholder. In a real environment, the private key should be managed securely.
    const privateKey = process.env.EXECUTION_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("EXECUTION_PRIVATE_KEY is not set");
    }
    this.wallet = new Wallet(privateKey, this.provider);
  }

  async executeTransaction(
    tx: TransactionRequest,
    strategy: ExecutionStrategy
  ): Promise<TransactionReceipt> {
    // 1. Nonce Management
    const nonce = await this.wallet.getNonce("latest");
    tx.nonce = nonce;

    // 2. Gas Calculation
    const gasPrice = await this.gasStrategy.calculateGasPrice();
    tx.maxFeePerGas = gasPrice.maxFeePerGas;
    tx.maxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas;

    // 3. Signing
    const signedTx = await this.wallet.signTransaction(tx);

    // 4. Broadcasting
    let txResponse: TransactionResponse;
    if (strategy === ExecutionStrategy.PUBLIC) {
      txResponse = await this.provider.broadcastTransaction(signedTx);
    } else {
      // Placeholder for private transaction logic (e.g., Flashbots)
      throw new Error("Private transaction strategy not implemented.");
    }

    // 5. Monitoring and Confirmation
    const receipt = await txResponse.wait();
    if (receipt === null) {
      throw new Error("Transaction receipt is null.");
    }
    return receipt;
  }
}
