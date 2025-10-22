import {
  FlashbotsBundleProvider,
  FlashbotsBundleRawTransaction,
  FlashbotsBundleResolution,
  FlashbotsBundleTransaction,
} from '@flashbots/ethers-provider-bundle';
import { JsonRpcProvider } from 'ethers';
import { providers as providersV5, Wallet as WalletV5 } from 'ethers-v5';
import { flashbotsUrls } from '../config/flashbots.config';
import logger from './logger.service';
import { NonceManager } from '../utils/nonceManager';

export class FlashbotsService {
  private flashbotsProvider: FlashbotsBundleProvider | null = null;
  private authSigner: WalletV5;
  private providerV5: providersV5.StaticJsonRpcProvider;

  constructor(private provider: JsonRpcProvider, private executionSigner: NonceManager) {
    if (!process.env.FLASHBOTS_AUTH_KEY) {
      throw new Error('FLASHBOTS_AUTH_KEY must be set in the environment.');
    }
    this.providerV5 = new providersV5.StaticJsonRpcProvider(this.provider.connection.url);
    this.authSigner = new WalletV5(process.env.FLASHBOTS_AUTH_KEY, this.providerV5);
  }

  public async initialize(): Promise<void> {
    const network = await this.provider.getNetwork();
    const chainId = Number(network.chainId);

    if (!flashbotsUrls[chainId]) {
      logger.warn(`[FlashbotsService] Flashbots is not supported on chain ID ${chainId}. The service will be disabled.`);
      this.flashbotsProvider = null;
      return;
    }

    this.flashbotsProvider = await FlashbotsBundleProvider.create(
      this.providerV5,
      this.authSigner,
      flashbotsUrls[chainId]
    );
  }

  public async sendBundle(
    bundle: Array<FlashbotsBundleRawTransaction | FlashbotsBundleTransaction>,
    targetBlock: number
  ): Promise<boolean> {
    if (!this.flashbotsProvider) {
      throw new Error('FlashbotsService is not initialized.');
    }

    const signedBundle = await this.flashbotsProvider.signBundle(bundle);
    logger.info('Signed bundle:', signedBundle);

    const simulation = await this.flashbotsProvider.simulate(
      signedBundle,
      targetBlock
    );
    logger.info('Simulation result:', simulation);

    if ('error' in simulation || simulation.results.some(tx => 'revert' in (tx as any))) {
      logger.error('Flashbots bundle simulation failed:', simulation);
      return false;
    }

    const flashbotsTransaction = await this.flashbotsProvider.sendBundle(
      bundle,
      targetBlock
    );

    if ('error' in flashbotsTransaction) {
      logger.error('Error sending Flashbots bundle:', flashbotsTransaction.error.message);
      return false;
    }

    const resolution = await flashbotsTransaction.wait();

    if (resolution === FlashbotsBundleResolution.BundleIncluded) {
      logger.info('Flashbots bundle included in block:', targetBlock);
      return true;
    } else if (resolution === FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
      logger.warn('Flashbots bundle not included in block:', targetBlock);
      return false;
    } else if (resolution === FlashbotsBundleResolution.AccountNonceTooHigh) {
      logger.warn('Flashbots bundle failed due to nonce too high.');
      return false;
    }
    return false;
  }
}
