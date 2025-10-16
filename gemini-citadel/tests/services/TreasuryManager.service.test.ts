import { TreasuryManagerService } from '../../src/services/TreasuryManager.service';
import { IWalletConnector } from '../../src/interfaces/WalletConnector.interface';
import { JsonRpcProvider, Contract, formatUnits } from 'ethers';
import { botConfig } from '../../src/config/bot.config';

// Mock dependencies
jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  JsonRpcProvider: jest.fn(),
  Contract: jest.fn(),
  formatUnits: jest.fn(),
}));

jest.mock('../../src/config/bot.config', () => ({
  botConfig: {
    treasury: {
      walletAddress: '0xMockTreasuryAddress',
    },
  },
}));

const mockedJsonRpcProvider = JsonRpcProvider as jest.Mock;
const mockedContract = Contract as jest.Mock;
const mockedFormatUnits = formatUnits as jest.Mock;

describe('TreasuryManagerService', () => {
  let treasuryManager: TreasuryManagerService;
  let mockWalletConnector: jest.Mocked<IWalletConnector>;
  let mockProviderInstance: jest.Mocked<JsonRpcProvider>;
  let mockContractInstance: jest.Mocked<Contract>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockWalletConnector = {
        proposeERC20Transfer: jest.fn(),
    } as any;

    mockProviderInstance = {} as unknown as jest.Mocked<JsonRpcProvider>;
    mockContractInstance = {
      balanceOf: jest.fn(),
    } as unknown as jest.Mocked<Contract>;

    mockedJsonRpcProvider.mockReturnValue(mockProviderInstance);
    mockedContract.mockReturnValue(mockContractInstance);

    treasuryManager = new TreasuryManagerService(mockWalletConnector, 'fake_rpc_url');
  });

  describe('getTreasuryBalance', () => {
    it('should fetch and correctly format the token balance', async () => {
      // Arrange
      const asset = 'USDT';
      const rawBalance = 12345000000n;
      const formattedBalance = '12345.00';

      (mockContractInstance.balanceOf as unknown as jest.Mock).mockResolvedValue(rawBalance);
      mockedFormatUnits.mockReturnValue(formattedBalance);

      // Act
      const result = await treasuryManager.getTreasuryBalance(asset);

      // Assert
      expect(mockedContract).toHaveBeenCalledWith(
        '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT Contract Address
        expect.any(Array),
        mockProviderInstance
      );
      expect(mockContractInstance.balanceOf).toHaveBeenCalledWith(botConfig.treasury.walletAddress);
      expect(mockedFormatUnits).toHaveBeenCalledWith(rawBalance, 6); // USDT Decimals
      expect(result).toBe(parseFloat(formattedBalance));
    });

    it('should throw an error for an unconfigured asset', async () => {
        // Arrange
        const asset = 'UNKNOWN';

        // Act & Assert
        await expect(treasuryManager.getTreasuryBalance(asset)).rejects.toThrow(
          'Asset UNKNOWN not configured.'
        );
      });
  });
});