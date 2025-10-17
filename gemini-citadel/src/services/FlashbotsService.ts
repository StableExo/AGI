import {
  FlashbotsBundleProvider,
  FlashbotsBundleRawTransaction,
  FlashbotsBundleResolution,
  FlashbotsBundleTransaction,
} from '@flashbots/ethers-provider-bundle';
import { BigNumberish, JsonRpcProvider, Wallet } from 'ethers';
import { flashbotsUrls } from '../config/flashbots.config';
import logger from './logger.service';

export class FlashbotsService {
  private flashbotsProvider: FlashbotsBundleProvider | null = null;
  private authSigner: Wallet;

  constructor(private provider: JsonRpcProvider, private executionSigner: Wallet) {
    if (!process.env.FLASHBOTS_AUTH_KEY) {
      throw new Error('FLASHBOTS_AUTH_KEY must be set in the environment.');
    }
    this.authSigner = new Wallet(process.env.FLASHBOTS_AUTH_KEY);
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
      this.provider,
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
