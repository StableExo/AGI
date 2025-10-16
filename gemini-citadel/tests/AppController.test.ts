import { AppController } from '../src/AppController';
import { StrategyEngine } from '../src/services/strategy.service';
import { CexStrategyEngine } from '../src/services/CexStrategyEngine';
import { ExecutionManager } from '../src/services/ExecutionManager';
import { ArbitrageOpportunity } from '../src/models/ArbitrageOpportunity';
import { FlashbotsService } from '../src/services/FlashbotsService';
import { ICexArbitrageOpportunity } from '../src/interfaces/ICexArbitrageOpportunity';
import logger from '../src/services/logger.service';

// Mock the services
jest.mock('../src/services/strategy.service');
jest.mock('../src/services/CexStrategyEngine');
jest.mock('../src/services/ExecutionManager');
jest.mock('../src/services/FlashbotsService');

const mockFindDexOpportunities = jest.fn();
const mockFindCexOpportunities = jest.fn();
const mockExecuteTrade = jest.fn();

(StrategyEngine as jest.Mock).mockImplementation(() => ({
  findOpportunities: mockFindDexOpportunities,
}));

(CexStrategyEngine as jest.Mock).mockImplementation(() => ({
  findOpportunities: mockFindCexOpportunities,
}));

(ExecutionManager as jest.Mock).mockImplementation(() => ({
  executeTrade: mockExecuteTrade,
}));

const mockDexOpportunity = new ArbitrageOpportunity(100, [
  { action: 'Buy', exchange: 'exchangeA', pair: 'BTC/USDT', price: 50000, amount: 1 },
  { action: 'Sell', exchange: 'exchangeB', pair: 'BTC/USDT', price: 50100, amount: 1 },
]);

const mockCexOpportunity: ICexArbitrageOpportunity = {
  pair: { base: 'BTC', quote: 'USDT' },
  buyOn: 'cex_a',
  sellOn: 'cex_b',
  buyPrice: 50000,
  sellPrice: 50500,
  potentialProfit: 400,
};

describe('AppController', () => {
  let appController: AppController;
  let strategyEngine: StrategyEngine;
  let cexStrategyEngine: CexStrategyEngine;
  let executionManager: ExecutionManager;
  let flashbotsService: FlashbotsService;

  beforeEach(() => {
    mockFindDexOpportunities.mockClear();
    mockFindCexOpportunities.mockClear();
    mockExecuteTrade.mockClear();

    strategyEngine = new (StrategyEngine as any)(null);
    cexStrategyEngine = new (CexStrategyEngine as any)(null);
    executionManager = new (ExecutionManager as any)(null, null);
    flashbotsService = new (FlashbotsService as any)(null, null);

    appController = new AppController(
      null as any,
      executionManager,
      strategyEngine,
      flashbotsService,
      cexStrategyEngine
    );
  });

  describe('runDexCycle', () => {
    it('should find and execute a DEX opportunity', async () => {
      mockFindDexOpportunities.mockResolvedValue([mockDexOpportunity]);
      await appController.runDexCycle();
      expect(mockFindDexOpportunities).toHaveBeenCalledTimes(1);
      expect(mockExecuteTrade).toHaveBeenCalledWith(mockDexOpportunity, process.env.FLASH_SWAP_CONTRACT_ADDRESS);
    });
  });

  describe('runCexCycle', () => {
    it('should find and log a CEX opportunity', async () => {
      const loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation();
      mockFindCexOpportunities.mockResolvedValue([mockCexOpportunity]);
      await appController.runCexCycle();
      expect(mockFindCexOpportunities).toHaveBeenCalledTimes(1);
      // Note: CEX execution is not implemented yet, so we check for the log message.
      expect(loggerInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Opportunity: Buy BTC on cex_a'));
      loggerInfoSpy.mockRestore();
    });

    it('should not execute if no CEX opportunities are found', async () => {
      mockFindCexOpportunities.mockResolvedValue([]);
      await appController.runCexCycle();
      expect(mockFindCexOpportunities).toHaveBeenCalledTimes(1);
      expect(mockExecuteTrade).not.toHaveBeenCalled();
    });
  });

  it('should handle errors from the CEX strategy engine gracefully', async () => {
    const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation();
    const testError = new Error('CEX Strategy Engine Failed');
    mockFindCexOpportunities.mockRejectedValue(testError);

    await appController.runCexCycle();

    expect(mockExecuteTrade).not.toHaveBeenCalled();
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      `[AppController] An error occurred during the CEX analysis cycle:`,
      testError
    );
    loggerErrorSpy.mockRestore();
  });
});