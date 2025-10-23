// gemini-citadel/src/services/NonceManager.ts
import { ethers, AbstractSigner, Provider, Signer, TransactionRequest, TransactionResponse, TransactionCount, Network } from 'ethers';
import { Mutex } from 'async-mutex';
import logger from './logger.service';

/**
 * A wrapper for an Ethers Signer that manages transaction nonces automatically.
 * It ensures that nonces are sequential and handles concurrency issues using a mutex.
 * It also provides resilience by resynchronizing with the blockchain's pending nonce count.
 * Implements the Ethers AbstractSigner interface, allowing it to be used as a drop-in
 * replacement for a standard Signer.
 */
export class NonceManager extends AbstractSigner {
    public address: string;
    private signer: Signer;
    private currentNonce: number = -1;
    private readonly mutex: Mutex;

    constructor(signer: Signer) {
        if (!signer.provider) {
            throw new Error("NonceManager requires a Signer instance connected to a provider.");
        }
        super(signer.provider);
        this.signer = signer;
        // This relies on the signer having its address readily available.
        // For hardware wallets or other signers where this is async, the implementation would need adjustment.
        if (!(signer as any).address) {
             throw new Error("The provided Signer must have a readily available address property.");
        }
        this.address = (signer as any).address;
        this.mutex = new Mutex();
        logger.debug(`[NonceManager] Instance created for address: ${this.address}`);
    }

    async getAddress(): Promise<string> {
        return Promise.resolve(this.address);
    }

    connect(provider: Provider | null): NonceManager {
        const newProvider = provider ?? this.provider;
        if (newProvider === this.provider) {
            return this;
        }
        const newSigner = this.signer.connect(newProvider);
        // Note: The nonce state is not carried over. This is the expected behavior for connect().
        // The new instance should initialize its own nonce state upon first use.
        return new NonceManager(newSigner);
    }

    /**
     * Initializes the internal nonce by fetching the latest transaction count from the provider.
     * This is called lazily on the first transaction if the nonce has not been set.
     */
    async initialize(): Promise<void> {
        const functionSig = `[NonceManager Address: ${this.address}]`;
        logger.info(`${functionSig} Initializing nonce...`);
        try {
            if (!this.provider) {
                throw new Error("Provider not available for nonce initialization.");
            }
            this.currentNonce = await this.provider.getTransactionCount(this.address, 'latest');
            logger.info(`${functionSig} Initial nonce set to: ${this.currentNonce}`);
        } catch (error: any) {
            logger.error(`${functionSig} CRITICAL: Failed to initialize nonce: ${error.message}`);
            throw new Error(`Nonce initialization failed: ${error.message}`);
        }
    }

    /**
     * Gets the next available nonce in an atomic manner.
     * It handles lazy initialization and resynchronizes with the pending nonce if needed.
     * @returns {Promise<number>} The next nonce to use for a transaction.
     */
    async getNextNonce(): Promise<number> {
        const functionSig = `[NonceManager Address: ${this.address}]`;
        const release = await this.mutex.acquire();
        logger.debug(`${functionSig} Mutex acquired for getNextNonce.`);

        try {
            // Lazy initialization if nonce is not yet set
            if (this.currentNonce < 0) {
                logger.warn(`${functionSig} Nonce not initialized. Initializing within lock...`);
                await this.initialize();
            }

            let pendingNonce: number;
            try {
                if (!this.provider) {
                    throw new Error("Provider not available for fetching pending nonce.");
                }
                pendingNonce = await this.provider.getTransactionCount(this.address, 'pending');
            } catch (fetchError: any) {
                logger.error(`${functionSig} Error fetching pending transaction count: ${fetchError.message}`);
                throw new Error(`Failed to fetch pending nonce: ${fetchError.message}`);
            }

            // If the pending nonce from the network is higher, it means another transaction
            // was sent from this account elsewhere. We must update our internal nonce.
            if (pendingNonce > this.currentNonce) {
                logger.info(`${functionSig} Pending nonce (${pendingNonce}) > current internal nonce (${this.currentNonce}). Updating.`);
                this.currentNonce = pendingNonce;
            }

            const nonceToUse = this.currentNonce;
            this.currentNonce++; // Increment for the next call
            logger.info(`${functionSig} Providing nonce: ${nonceToUse}, next internal nonce will be: ${this.currentNonce}`);
            return nonceToUse;

        } finally {
            release();
            logger.debug(`${functionSig} Mutex released for getNextNonce.`);
        }
    }

    /**
     * Resynchronizes the internal nonce count with the 'latest' transaction count from the blockchain.
     * This is a recovery mechanism in case of nonce errors.
     */
    async resyncNonce(): Promise<void> {
        const functionSig = `[NonceManager Address: ${this.address}]`;
        const release = await this.mutex.acquire();
        logger.warn(`${functionSig} Mutex acquired for resyncNonce...`);
        try {
            logger.warn(`${functionSig} Resyncing nonce by fetching 'latest' count.`);
            await this.initialize(); // Re-initializes with the 'latest' count
            logger.info(`${functionSig} Nonce resync completed. New internal nonce: ${this.currentNonce}`);
        } catch (error: any) {
            logger.error(`${functionSig} Failed to resync nonce: ${error.message}`);
            throw new Error(`Nonce resynchronization failed: ${error.message}`);
        } finally {
            release();
            logger.debug(`${functionSig} Mutex released for resyncNonce.`);
        }
    }

    /**
     * Populates and sends a transaction with a managed nonce.
     * @param {TransactionRequest} tx - The transaction request to send.
     * @returns {Promise<TransactionResponse>} The response from the submitted transaction.
     */
    async sendTransaction(tx: TransactionRequest): Promise<TransactionResponse> {
        const functionSig = `[NonceManager Address: ${this.address}]`;
        logger.debug(`${functionSig} sendTransaction called...`);

        if (typeof this.signer.sendTransaction !== 'function') {
            throw new Error("The underlying signer does not implement sendTransaction.");
        }

        const nonce = await this.getNextNonce();
        const populatedTx = { ...tx, nonce };

        // Ethers v6 requires a chainId. Ensure it's present.
        if (populatedTx.chainId === undefined) {
            const network: Network | null = this.provider ? await this.provider.getNetwork() : null;
            if (network) {
                populatedTx.chainId = network.chainId;
            } else {
                logger.warn(`${functionSig} Could not determine chainId for transaction.`);
            }
        }
        logger.debug(`${functionSig} Populated transaction with nonce ${nonce} and chainId ${populatedTx.chainId}`);

        try {
            logger.debug(`${functionSig} Delegating sendTransaction to underlying signer...`);
            const txResponse = await this.signer.sendTransaction(populatedTx);
            logger.info(`${functionSig} Underlying signer submitted transaction. Hash: ${txResponse.hash}`);
            return txResponse;
        } catch (error: any) {
            logger.error(`${functionSig} Error sending transaction: ${error.message}`, { code: error.code });

            // Check for nonce-related errors and trigger a resync for recovery.
            const message = (error.message || '').toLowerCase();
            const code = error.code;
            if (code === 'NONCE_EXPIRED' || message.includes('nonce too low') || message.includes('invalid nonce')) {
                logger.warn(`${functionSig} Nonce error detected. Triggering background resync...`);
                // Do not await. Let the error propagate up immediately while resync runs.
                this.resyncNonce().catch(resyncErr => logger.error(`${functionSig} Background resync failed: ${resyncErr.message}`));
            }
            throw error; // Re-throw for upstream handling
        }
    }

    /**
     * Returns the underlying Signer instance.
     * @returns {Signer}
     */
    getSigner(): Signer {
        return this.signer;
    }
}
