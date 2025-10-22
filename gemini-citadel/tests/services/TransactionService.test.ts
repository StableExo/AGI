import { TransactionService } from 'src/services/TransactionService';
import { IGasStrategy } from 'src/models/IGasStrategy';
import { ExecutionStrategy } from 'src/models/ExecutionStrategy';
import { JsonRpcProvider, TransactionRequest, TransactionReceipt, Wallet } from 'ethers';

// Mock dependencies
jest.mock('ethers', () => {
    const originalEthers = jest.requireActual('ethers');
    return {
        ...originalEthers,
        Wallet: jest.fn(),
        JsonRpcProvider: jest.fn(),
    };
});

// Set a dummy private key before any imports that might need it
process.env.EXECUTION_PRIVATE_KEY = '0x0123456789012345678901234567890123456789012345678901234567890123';

describe('TransactionService', () => {
    let transactionService: TransactionService;
    let mockGasStrategy: jest.Mocked<IGasStrategy>;

    const mockWait = jest.fn();
    const mockBroadcastTransaction = jest.fn();
    const mockSignTransaction = jest.fn();
    const mockGetNonce = jest.fn();

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Configure mock implementations
        mockWait.mockResolvedValue({ status: 1, transactionHash: 'tx-hash' } as unknown as TransactionReceipt);
        mockBroadcastTransaction.mockResolvedValue({ hash: 'tx-hash', wait: mockWait });
        mockSignTransaction.mockResolvedValue('signed-tx-hash');
        mockGetNonce.mockResolvedValue(1);

        (Wallet as unknown as jest.Mock).mockImplementation(() => ({
            getNonce: mockGetNonce,
            signTransaction: mockSignTransaction,
        }));
        (JsonRpcProvider as unknown as jest.Mock).mockImplementation(() => ({
            broadcastTransaction: mockBroadcastTransaction,
        }));

        mockGasStrategy = {
            calculateGasPrice: jest.fn().mockResolvedValue({
                maxFeePerGas: 20000000000n,
                maxPriorityFeePerGas: 1000000000n,
            }),
        };

        transactionService = new TransactionService(mockGasStrategy);
    });

    it('should execute a public transaction successfully', async () => {
        const tx: TransactionRequest = { to: '0xaddress', value: 100n };
        const receipt = await transactionService.executeTransaction(tx, ExecutionStrategy.PUBLIC);

        // Verify the sequence of calls
        expect(mockGetNonce).toHaveBeenCalledWith('latest');
        expect(mockGasStrategy.calculateGasPrice).toHaveBeenCalled();
        expect(mockSignTransaction).toHaveBeenCalledWith(expect.objectContaining({
            to: '0xaddress',
            value: 100n,
            nonce: 1,
            maxFeePerGas: 20000000000n,
            maxPriorityFeePerGas: 1000000000n,
        }));
        expect(mockBroadcastTransaction).toHaveBeenCalledWith('signed-tx-hash');
        expect(mockWait).toHaveBeenCalled();

        // Verify the final output
        expect(receipt).toEqual({ status: 1, transactionHash: 'tx-hash' });
    });

    it('should throw an error for private transactions', async () => {
        const tx: TransactionRequest = { to: '0xaddress', value: 100n };
        await expect(
            transactionService.executeTransaction(tx, ExecutionStrategy.PRIVATE)
        ).rejects.toThrow('Private transaction strategy not implemented.');

        // Ensure no transaction calls were made for the private path
        expect(mockBroadcastTransaction).not.toHaveBeenCalled();
    });

    it('should throw an error if private key is not set', () => {
        // Unset the env var
        const originalKey = process.env.EXECUTION_PRIVATE_KEY;
        delete process.env.EXECUTION_PRIVATE_KEY;
        expect(() => new TransactionService(mockGasStrategy)).toThrow('EXECUTION_PRIVATE_KEY is not set');
        // Reset it for other tests
        process.env.EXECUTION_PRIVATE_KEY = originalKey;
    });
});
