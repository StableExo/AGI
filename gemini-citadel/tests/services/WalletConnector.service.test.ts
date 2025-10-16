import { WalletConnectorService } from '../../src/services/WalletConnector.service';
import { JsonRpcProvider, Contract, formatUnits } from 'ethers';

// Mock the named exports from 'ethers'
jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'), // Import and retain default exports
  JsonRpcProvider: jest.fn(),
  Contract: jest.fn(),
  formatUnits: jest.fn(),
}));

// Cast the mocked functions to the correct type for type-safe mocking
const mockedJsonRpcProvider = JsonRpcProvider as jest.Mock;
const mockedContract = Contract as jest.Mock;
const mockedFormatUnits = formatUnits as jest.Mock;

describe('WalletConnectorService', () => {
  let walletConnector: WalletConnectorService;
  let mockProviderInstance: jest.Mocked<JsonRpcProvider>;
  let mockContractInstance: jest.Mocked<Contract>;

  beforeEach(() => {
    // Reset mocks before each test to ensure isolation
    jest.clearAllMocks();

    walletConnector = new WalletConnectorService();

    // Mock the instances that will be created by the service
    mockProviderInstance = {
      // Mock any methods on the provider instance if needed
    } as unknown as jest.Mocked<JsonRpcProvider>;

    mockContractInstance = {
      balanceOf: jest.fn(),
    } as unknown as jest.Mocked<Contract>;

    // Configure the constructor mocks to return our mocked instances
    mockedJsonRpcProvider.mockReturnValue(mockProviderInstance);
    mockedContract.mockReturnValue(mockContractInstance);
  });

  describe('getTreasuryBalance', () => {
    it('should fetch and correctly format the token balance', async () => {
      // Arrange
      const contractAddress = '0xSomeTokenAddress';
      const walletAddress = '0xSomeWalletAddress';
      const decimals = 6;
      const rawBalance = 12345000000n; // Use BigInt for raw balance
      const formattedBalance = '12345.00';

      // Mock the return value of the contract's `balanceOf` method
      (mockContractInstance.balanceOf as unknown as jest.Mock).mockResolvedValue(rawBalance);

      // Mock the return value of the `formatUnits` function
      mockedFormatUnits.mockReturnValue(formattedBalance);

      // Act
      const result = await walletConnector.getTreasuryBalance(contractAddress, walletAddress, decimals);

      // Assert
      // Verify that the provider and contract were instantiated correctly
      expect(mockedJsonRpcProvider).toHaveBeenCalledWith(expect.any(String));
      expect(mockedContract).toHaveBeenCalledWith(contractAddress, expect.any(Array), mockProviderInstance);

      // Verify that the correct methods were called with the right arguments
      expect(mockContractInstance.balanceOf).toHaveBeenCalledWith(walletAddress);
      expect(mockedFormatUnits).toHaveBeenCalledWith(rawBalance, decimals);

      // Verify that the final result is the parsed float of the formatted string
      expect(result).toBe(parseFloat(formattedBalance));
    });

    it('should return a float number when given a valid balance', async () => {
        // Arrange
        const contractAddress = '0xAnotherTokenAddress';
        const walletAddress = '0xAnotherWalletAddress';
        const decimals = 18;
        const rawBalance = 5000000000000000000n; // 5 tokens as BigInt
        const formattedBalance = '5.0';

        (mockContractInstance.balanceOf as unknown as jest.Mock).mockResolvedValue(rawBalance);
        mockedFormatUnits.mockReturnValue(formattedBalance);

        // Act
        const result = await walletConnector.getTreasuryBalance(contractAddress, walletAddress, decimals);

        // Assert
        expect(typeof result).toBe('number');
        expect(result).toBe(5.0);
    });
  });
});