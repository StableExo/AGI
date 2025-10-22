import { AppController } from '../src/AppController';
import { ExchangeDataProvider } from '../src/services/ExchangeDataProvider';
import { ExecutionManager } from '../src/services/ExecutionManager';
import { FlashbotsService } from '../src/services/FlashbotsService';
import { TelegramAlertingService } from '../src/services/telegram-alerting.service';
import { MarketIntelligenceService } from '../src/services/MarketIntelligenceService';
import { CexStrategyEngine } from '../src/services/CexStrategyEngine';
import { ArbitrageEngine } from '../src/havoc-core/core/ArbitrageEngine';
import { KafkaHealthMonitor } from '../src/services/KafkaHealthMonitor';
import KafkaService from '../src/services/KafkaService';
import { botConfig } from '../src/config/bot.config';

// Mock all service dependencies
jest.mock('../src/services/ExchangeDataProvider');
jest.mock('../src/services/ExecutionManager');
jest.mock('../src/services/FlashbotsService');
jest.mock('../src/services/telegram-alerting.service');
jest.mock('../src/services/MarketIntelligenceService');
jest.mock('../src/services/CexStrategyEngine'); // Mock the whole class
jest.mock('../src/havoc-core/core/ArbitrageEngine');
jest.mock('../src/services/KafkaHealthMonitor');
jest.mock('../src/services/KafkaService');

describe('AppController', () => {
  let appController: AppController;
  let dataProviderMock: jest.Mocked<ExchangeDataProvider>;
  let executionManagerMock: jest.Mocked<ExecutionManager>;
  let flashbotsServiceMock: jest.Mocked<FlashbotsService>;
  let telegramAlertingServiceMock: jest.Mocked<TelegramAlertingService>;
  let marketIntelligenceServiceMock: jest.Mocked<MarketIntelligenceService>;
  let cexStrategyEngineMock: jest.Mocked<CexStrategyEngine>;
  let arbitrageEngineMock: jest.Mocked<ArbitrageEngine>;
  let kafkaHealthMonitorMock: jest.Mocked<KafkaHealthMonitor>;

  beforeEach(() => {
    // Create mock instances of all dependencies
    dataProviderMock = new ExchangeDataProvider([]) as jest.Mocked<ExchangeDataProvider>;
    executionManagerMock = new ExecutionManager(null as any, null as any, null as any, null as any) as jest.Mocked<ExecutionManager>;
    flashbotsServiceMock = new FlashbotsService(null as any, null as any) as jest.Mocked<FlashbotsService>;
    telegramAlertingServiceMock = new TelegramAlertingService(null as any, null as any, null as any) as jest.Mocked<TelegramAlertingService>;
    marketIntelligenceServiceMock = new MarketIntelligenceService() as jest.Mocked<MarketIntelligenceService>;
    cexStrategyEngineMock = new CexStrategyEngine(null as any, null as any) as jest.Mocked<CexStrategyEngine>;
    arbitrageEngineMock = {
        runCycle: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<ArbitrageEngine>;
    kafkaHealthMonitorMock = new KafkaHealthMonitor() as jest.Mocked<KafkaHealthMonitor>;

    (KafkaService.connect as jest.Mock).mockResolvedValue(undefined);

    // Instantiate the real AppController with mocked dependencies
    appController = new AppController(
      dataProviderMock,
      executionManagerMock,
      flashbotsServiceMock,
      cexStrategyEngineMock,
      telegramAlertingServiceMock,
      marketIntelligenceServiceMock,
      arbitrageEngineMock,
      kafkaHealthMonitorMock
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should initialize the nervous system on start', async () => {
    await appController.start();

    expect(KafkaService.connect).toHaveBeenCalledTimes(1);
    expect(cexStrategyEngineMock.start).toHaveBeenCalledTimes(1);
  });

  it('should start the DEX cycle on start', async () => {
    await appController.start();

    expect(arbitrageEngineMock.runCycle).toHaveBeenCalledTimes(1);
  });

  it('should run the DEX cycle periodically', async () => {
      jest.useFakeTimers();
      await appController.start();

      expect(arbitrageEngineMock.runCycle).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(botConfig.loopIntervalMs);

      expect(arbitrageEngineMock.runCycle).toHaveBeenCalledTimes(2);
      jest.useRealTimers();
  });
});
