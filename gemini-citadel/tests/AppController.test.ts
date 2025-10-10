import { AppController } from '../src/AppController';
import { DataService } from '../src/services/data.service';
import { StrategyEngine } from '../src/services/strategy.service';
import * as fs from 'fs';

// Mock the dependent services and modules
jest.mock('../src/services/data.service');
jest.mock('../src/services/strategy.service');
jest.mock('fs');

describe('AppController', () => {
  const mockReadFileSync = fs.readFileSync as jest.Mock;
  const originalRpcUrl = process.env.RPC_URL;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Set a default mock for readFileSync to prevent errors in tests
    mockReadFileSync.mockReturnValue('[]');
    // Ensure RPC_URL is set for the constructor
    process.env.RPC_URL = 'mock_rpc_url';
  });

  afterAll(() => {
    // Restore original environment variables
    process.env.RPC_URL = originalRpcUrl;
  });

  it('should be instantiated without throwing an error', () => {
    // Arrange
    // Provide a minimal valid JSON structure for pools.config.json
    const mockPoolConfig = [
      {
        name: 'Test Group',
        pools: ['0xTestPoolAddress'],
      },
    ];
    mockReadFileSync.mockReturnValue(JSON.stringify(mockPoolConfig));

    // Act & Assert
    let appControllerInstance: AppController | null = null;
    expect(() => {
      appControllerInstance = new AppController();
    }).not.toThrow();

    expect(appControllerInstance).not.toBeNull();
    expect(appControllerInstance).toBeInstanceOf(AppController);
  });
});