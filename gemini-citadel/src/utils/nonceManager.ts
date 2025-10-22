import { ethers, AbstractSigner, Provider, Signer, TransactionRequest, TransactionResponse } from 'ethers';
import logger from '../services/logger.service';
import { Mutex } from 'async-mutex';

export class NonceManager extends AbstractSigner {
    private signer: Signer;
    public address: string;
    private currentNonce: number = -1;
    private mutex: Mutex;

    constructor(signer: Signer) {
        super(signer.provider);

        if (!signer || !signer.provider || typeof signer.getAddress !== 'function') {
            throw new Error("NonceManager requires a valid Ethers Signer instance.");
        }
        this.signer = signer;
        this.address = ''; // Initialize here, set in an async factory or initialize method
        this.mutex = new Mutex();
        logger.debug(`[NonceManager] Instance created.`);
    }

    async init(): Promise<this> {
        this.address = await this.signer.getAddress();
        logger.debug(`[NonceManager] Associated address set to: ${this.address}`);
        await this.initialize();
        return this;
    }

    async getAddress(): Promise<string> {
        return Promise.resolve(this.address);
    }

    connect(provider: Provider | null): NonceManager {
        const currentProvider = this.provider;
        const newProvider = (provider === null) ? currentProvider : provider;
        if (newProvider === currentProvider) {
            return this;
        }
        const newSigner = (this.signer as any).connect(newProvider);
        return new NonceManager(newSigner);
    }

    private async initialize(): Promise<void> {
        const functionSig = `[NonceManager Address: ${this.address}]`;
        logger.info(`${functionSig} Initializing nonce...`);
        try {
            if (!this.provider) throw new Error("Provider not available for nonce initialization.");
            this.currentNonce = await this.provider.getTransactionCount(this.address, 'latest');
            logger.info(`${functionSig} Initial nonce set to: ${this.currentNonce}`);
        } catch (error: any) {
            logger.error(`${functionSig} CRITICAL: Failed to initialize nonce: ${error.message}`);
            throw new Error(`Nonce initialization failed: ${error.message}`);
        }
    }

    async getNextNonce(): Promise<number> {
        const functionSig = `[NonceManager Address: ${this.address}]`;
        const release = await this.mutex.acquire();
        logger.debug(`${functionSig} Mutex acquired for getNextNonce.`);
        try {
            if (this.currentNonce < 0) {
                logger.warn(`${functionSig} Nonce not initialized. Attempting initialization within lock...`);
                await this.initialize();
            }

            let pendingNonce: number;
            try {
                 if (!this.provider) throw new Error("Provider not available for fetching pending nonce.");
                 pendingNonce = await this.provider.getTransactionCount(this.address, 'pending');
            } catch (fetchError: any) {
                 logger.error(`${functionSig} Error fetching pending transaction count: ${fetchError.message}`);
                 throw new Error(`Failed to fetch pending nonce: ${fetchError.message}`);
            }

            if (pendingNonce > this.currentNonce) {
                 logger.info(`${functionSig} Pending nonce (${pendingNonce}) is higher than current internal nonce (${this.currentNonce}). Updating internal nonce.`);
                 this.currentNonce = pendingNonce;
            }

            const nonceToUse = this.currentNonce;
            this.currentNonce++;
            logger.info(`${functionSig} Providing nonce: ${nonceToUse}, next internal nonce will be: ${this.currentNonce}`);
            return nonceToUse;

        } finally {
            release();
            logger.debug(`${functionSig} Mutex released for getNextNonce.`);
        }
    }

     async resyncNonce(): Promise<void> {
         const functionSig = `[NonceManager Address: ${this.address}]`;
         const release = await this.mutex.acquire();
         logger.warn(`${functionSig} Mutex acquired for resyncNonce...`);
         try {
             logger.warn(`${functionSig} Resyncing nonce... Resetting internal count and fetching latest.`);
             this.currentNonce = -1;
             await this.initialize();
             logger.info(`${functionSig} Nonce resync completed. New internal nonce: ${this.currentNonce}`);
         } catch (error: any) {
              logger.error(`${functionSig} Failed to resync nonce: ${error.message}`);
              throw new Error(`Nonce resynchronization failed: ${error.message}`);
         } finally {
             release();
             logger.debug(`${functionSig} Mutex released for resyncNonce.`);
         }
     }

    async sendTransaction(tx: TransactionRequest): Promise<TransactionResponse> {
        const functionSig = `[NonceManager Address: ${this.address}]`;
        logger.debug(`${functionSig} sendTransaction called...`);

        if (typeof (this.signer as any).sendTransaction !== 'function') {
             throw new Error("Underlying signer does not support sendTransaction");
        }

        const nonce = await this.getNextNonce();
        const populatedTx = { ...tx, nonce: nonce };

        if (populatedTx.chainId === undefined) {
             const network = await this.provider?.getNetwork();
             if (network) {
                  populatedTx.chainId = network.chainId;
             } else {
                  logger.warn(`${functionSig} Could not determine chainId for transaction.`);
             }
        }
        logger.debug(`${functionSig} Populated transaction with nonce ${nonce} and chainId ${populatedTx.chainId}`);

        try {
            logger.debug(`${functionSig} Delegating sendTransaction to underlying signer...`);
            const txResponse = await (this.signer as any).sendTransaction(populatedTx);
            logger.info(`${functionSig} Underlying signer submitted transaction. Hash: ${txResponse.hash}`);
            return txResponse as TransactionResponse;
        } catch (error: any) {
            logger.error(`${functionSig} Error sending transaction via underlying signer: ${error.message}`);
            const message = error.message?.toLowerCase() || '';
            const code = error.code;
            if (code === 'NONCE_EXPIRED' || message.includes('nonce too low') || message.includes('invalid nonce')) {
                 logger.warn(`${functionSig} Nonce error detected during send, attempting resync...`);
                 this.resyncNonce().catch(resyncErr => logger.error(`${functionSig} Background resync failed: ${resyncErr.message}`));
            }
            throw error;
        }
    }

    getSigner(): Signer {
        return this.signer;
    }

    async signTransaction(tx: TransactionRequest): Promise<string> {
        throw new Error("signTransaction is not implemented.");
    }

    async signMessage(message: string | Uint8Array): Promise<string> {
        throw new Error("signMessage is not implemented.");
    }

    async signTypedData(domain: any, types: any, value: any): Promise<string> {
        throw new Error("signTypedData is not implemented.");
    }
}
