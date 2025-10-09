import { AppController } from './AppController';
import { DataService } from './services/data.service';
import { StrategyEngine } from './services/strategy.service';
import * as fs from 'fs';
import * as path from 'path';

// Mock the services and modules
jest.mock('./services/data.service');
jest.mock('./services/strategy.service');
jest.mock('fs');

// Mock console methods to keep test output clean
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'info').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('AppController', () => {
  const mockDataService = new DataService('') as jest.Mocked<DataService>;
  const mockStrategyEngine = new StrategyEngine(mockDataService, []) as jest.Mocked<StrategyEngine>;
  const mockReadFileSync = fs.readFileSync as jest.Mock;
  const originalRpcUrl = process.env.RPC_URL;

  beforeAll(() => {
    process.env.RPC_URL = 'http://localhost:8545';
  });

  afterAll(() => {
    process.env.RPC_URL = originalRpcUrl;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (DataService as jest.Mock).mockImplementation(() => mockDataService);
    (StrategyEngine as jest.Mock).mockImplementation(() => mockStrategyEngine);
  });

  describe('constructor', () => {
    it('should correctly parse multi-pool config and instantiate services', () => {
        // Arrange: Use a more complex configuration to test the transformation logic thoroughly.
        const mockPoolConfig = [
          {
            name: 'USDC/WETH Group',
            pools: ['0xPool1', '0xPool2'],
          },
          {
            name: 'DAI/WETH Group',
            pools: ['0xPool3'],
          },
        ];
        mockReadFileSync.mockReturnValue(JSON.stringify(mockPoolConfig));

        // This is the expected flat structure that StrategyEngine should receive after the transformation.
        const expectedStrategyConfig = [
          { name: 'USDC/WETH Group', address: '0xPool1', tokenA: '', tokenB: '', fee: 0 },
          { name: 'USDC/WETH Group', address: '0xPool2', tokenA: '', tokenB: '', fee: 0 },
          { name: 'DAI/WETH Group', address: '0xPool3', tokenA: '', tokenB: '', fee: 0 },
        ];

        // Act
        new AppController();

        // Assert
        const expectedConfigPath = path.join(__dirname, '..', 'pools.config.json');
        expect(mockReadFileSync).toHaveBeenCalledWith(expectedConfigPath, 'utf8');
        expect(DataService).toHaveBeenCalledWith(process.env.RPC_URL);
        // Verify that StrategyEngine was called with the correctly transformed config
        expect(StrategyEngine).toHaveBeenCalledWith(mockDataService, expectedStrategyConfig);
      });

    it('should throw an error if RPC_URL environment variable is not set', () => {
      mockReadFileSync.mockReturnValue('[]'); // Provide a default mock for this test case
      delete process.env.RPC_URL;
      expect(() => new AppController()).toThrow('RPC_URL environment variable is not set.');
      process.env.RPC_URL = 'http://localhost:8545';
    });
  });

  describe('runSingleCycle', () => {
    beforeEach(() => {
        // Provide a default mock for fs.readFileSync for all tests in this block
        mockReadFileSync.mockReturnValue(
            JSON.stringify([{ name: 'Test Pool', pools: ['0xPool1'] }])
        );
    });

    it('should call findOpportunities and log success', async () => {
      const appController = new AppController();
      const strategyEngineInstance = (StrategyEngine as jest.Mock).mock.results[0].value;
      const findOpportunitiesSpy = jest.spyOn(strategyEngineInstance, 'findOpportunities').mockResolvedValue([]);
      const logSpy = jest.spyOn(console, 'log');

      await appController.runSingleCycle();

      expect(findOpportunitiesSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Analysis cycle completed successfully.'));
    });

    it('should log an error if findOpportunities throws', async () => {
      const appController = new AppController();
      const testError = new Error('Network Error');
      const strategyEngineInstance = (StrategyEngine as jest.Mock).mock.results[0].value;
      jest.spyOn(strategyEngineInstance, 'findOpportunities').mockRejectedValue(testError);
      const errorSpy = jest.spyOn(console, 'error');

      await appController.runSingleCycle();

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('An error occurred during the analysis cycle:'), testError);
    });

    it('should log when opportunities are found', async () => {
        const appController = new AppController();
        const strategyEngineInstance = (StrategyEngine as jest.Mock).mock.results[0].value;
        jest.spyOn(strategyEngineInstance, 'findOpportunities').mockResolvedValue([{ type: 'arbitrage', profit: 0.5, path: [{}, {}] } as any]);
        const logSpy = jest.spyOn(console, 'log');

        await appController.runSingleCycle();

        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Found 1 opportunities.'));
      });
  });
});