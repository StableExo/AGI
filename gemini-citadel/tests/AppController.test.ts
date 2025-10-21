import { AppController } from '../src/AppController';
import { StrategyEngine } from '../src/services/strategy.service';
import { CexStrategyEngine } from '../src/services/CexStrategyEngine';
import { DexStrategyEngine } from '../src/services/DexStrategyEngine';
import { ExecutionManager } from '../src/services/ExecutionManager';
import { ArbitrageOpportunity } from '../src/models/ArbitrageOpportunity';
import { FlashbotsService } from '../src/services/FlashbotsService';
import { MarketIntelligenceService } from '../src/services/MarketIntelligenceService';
import logger from '../src/services/logger.service';

// Mock the services
jest.mock('../src/services/strategy.service');
jest.mock('../src/services/MarketIntelligenceService');
jest.mock('../src/services/CexStrategyEngine');
jest.mock('../src/services/DexStrategyEngine');
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

const mockExecuteCexTrade = jest.fn();

(ExecutionManager as jest.Mock).mockImplementation(() => ({
  executeTrade: mockExecuteTrade,
  executeCexTrade: mockExecuteCexTrade,
}));

const mockDexOpportunity = new ArbitrageOpportunity(100, [
  { action: 'BUY', exchange: 'exchangeA', pair: 'BTC/USDT', price: 50000, amount: 1 },
  { action: 'SELL', exchange: 'exchangeB', pair: 'BTC/USDT', price: 50100, amount: 1 },
]);

const mockCexOpportunity = new ArbitrageOpportunity(400, [
  { action: 'BUY', exchange: 'cex_a', pair: 'BTC/USDT', price: 50000, amount: 1 },
  { action: 'SELL', exchange: 'cex_b', pair: 'BTC/USDT', price: 50500, amount: 1 },
]);

describe('AppController', () => {
  let appController: AppController;
  let strategyEngine: StrategyEngine;
  let cexStrategyEngine: CexStrategyEngine;
  let dexStrategyEngine: DexStrategyEngine;
  let executionManager: ExecutionManager;
  let flashbotsService: FlashbotsService;
  let marketIntelligenceService: MarketIntelligenceService;

  beforeEach(() => {
    mockFindDexOpportunities.mockClear();
    mockFindCexOpportunities.mockClear();
    mockExecuteTrade.mockClear();
    mockExecuteCexTrade.mockClear();

    strategyEngine = new (StrategyEngine as any)(null);
    cexStrategyEngine = new (CexStrategyEngine as any)(null);
    dexStrategyEngine = new (DexStrategyEngine as any)(null, null);
    executionManager = new (ExecutionManager as any)(null, null);
    flashbotsService = new (FlashbotsService as any)(null, null);
    marketIntelligenceService = new (MarketIntelligenceService as any)();

    appController = new AppController(
      null as any,
      executionManager,
      strategyEngine,
      flashbotsService,
      cexStrategyEngine,
      dexStrategyEngine,
      null as any, // For TelegramAlertingService
      marketIntelligenceService
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
    it('should find and execute a CEX opportunity', async () => {
      mockFindCexOpportunities.mockResolvedValue([mockCexOpportunity]);
      await appController.runCexCycle();
      expect(mockFindCexOpportunities).toHaveBeenCalledTimes(1);
      expect(mockExecuteCexTrade).toHaveBeenCalledWith(mockCexOpportunity);
    });

    it('should not execute if no CEX opportunities are found', async () => {
      mockFindCexOpportunities.mockResolvedValue([]);
      await appController.runCexCycle();
      expect(mockFindCexOpportunities).toHaveBeenCalledTimes(1);
      expect(mockExecuteCexTrade).not.toHaveBeenCalled();
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