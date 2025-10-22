import { NonceManager } from '../../src/utils/nonceManager';
import { Wallet, JsonRpcProvider } from 'ethers';
import { mock } from 'jest-mock-extended';

describe('NonceManager', () => {
    let nonceManager: NonceManager;
    let mockSigner: Wallet;
    let mockProvider: jest.Mocked<JsonRpcProvider>;

    beforeEach(async () => {
        mockProvider = mock<JsonRpcProvider>();
        mockSigner = new Wallet(Wallet.createRandom().privateKey, mockProvider);

        mockProvider.getTransactionCount.mockResolvedValue(10);

        nonceManager = await new NonceManager(mockSigner).init();
    });

    it('should initialize correctly and set the nonce', async () => {
        expect(nonceManager.address).toEqual(mockSigner.address);
        expect(mockProvider.getTransactionCount).toHaveBeenCalledWith(mockSigner.address, 'latest');
        expect(await nonceManager.getNextNonce()).toBe(10);
    });

    it('should increment the nonce for each transaction', async () => {
        expect(await nonceManager.getNextNonce()).toBe(10);
        expect(await nonceManager.getNextNonce()).toBe(11);
        expect(await nonceManager.getNextNonce()).toBe(12);
    });

    it('should resync the nonce if the pending nonce is higher', async () => {
        mockProvider.getTransactionCount.mockResolvedValue(15);
        await nonceManager.resyncNonce();
        expect(await nonceManager.getNextNonce()).toBe(15);
    });

    it('should send a transaction with the correct nonce', async () => {
        const tx = { to: '0x0000000000000000000000000000000000000000', value: 0 };
        (mockSigner as any).sendTransaction = jest.fn().mockResolvedValue({ hash: '0x123' });

        await nonceManager.sendTransaction(tx);

        expect((mockSigner as any).sendTransaction).toHaveBeenCalledWith(expect.objectContaining({ nonce: 10 }));
    });
});
