import { ExecutionManager } from '../src/services/ExecutionManager';
import { IOrderBuilder } from '../src/interfaces/IOrderBuilder';
import { ITradeOpportunity } from '../src/interfaces/ITradeOpportunity';

// Mock the console to capture log output
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

// Create mock builders
const mockBuilderA: IOrderBuilder = {
  buildOrder: jest.fn().mockResolvedValue('[LOG] Order for exchange A'),
};

const mockBuilderB: IOrderBuilder = {
  buildOrder: jest.fn().mockResolvedValue('[LOG] Order for exchange B'),
};

const sampleOpportunity: ITradeOpportunity = {
  type: 'Arbitrage',
  estimatedProfit: 10,
  actions: [
    { action: 'Buy', exchange: 'exchange_a', pair: 'BTC/USD', price: 100, amount: 1 },
    { action: 'Sell', exchange: 'exchange_b', pair: 'BTC/USD', price: 110, amount: 1 },
  ],
};

describe('ExecutionManager', () => {
  beforeEach(() => {
    // Clear mock calls and console spy before each test
    (mockBuilderA.buildOrder as jest.Mock).mockClear();
    (mockBuilderB.buildOrder as jest.Mock).mockClear();
    consoleLogSpy.mockClear();
  });

  it('should call the correct builders for an opportunity', async () => {
    const manager = new ExecutionManager([
      { name: 'exchange_a', instance: mockBuilderA },
      { name: 'exchange_b', instance: mockBuilderB },
    ]);

    await manager.execute(sampleOpportunity);

    expect(mockBuilderA.buildOrder).toHaveBeenCalledWith(sampleOpportunity);
    expect(mockBuilderB.buildOrder).toHaveBeenCalledWith(sampleOpportunity);
    expect(consoleLogSpy).toHaveBeenCalledWith('[LOG] Order for exchange A');
    expect(consoleLogSpy).toHaveBeenCalledWith('[LOG] Order for exchange B');
  });

  it('should only call a builder once even if multiple actions use it', async () => {
    const manager = new ExecutionManager([
      { name: 'exchange_a', instance: mockBuilderA },
    ]);

    const multiActionOpportunity: ITradeOpportunity = {
        ...sampleOpportunity,
        actions: [
            { action: 'Buy', exchange: 'exchange_a', pair: 'BTC/USD', price: 100, amount: 1 },
            { action: 'Buy', exchange: 'exchange_a', pair: 'ETH/USD', price: 10, amount: 1 },
        ]
    };

    await manager.execute(multiActionOpportunity);
    expect(mockBuilderA.buildOrder).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith('[LOG] Order for exchange A');
  });

  it('should log a warning for a missing builder', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const manager = new ExecutionManager([
      { name: 'exchange_a', instance: mockBuilderA },
    ]);

    await manager.execute(sampleOpportunity);

    expect(mockBuilderA.buildOrder).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('No order builder found for exchange protocol: "exchange_b"'));
    consoleWarnSpy.mockRestore();
  });
});