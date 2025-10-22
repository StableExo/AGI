import { CoinbaseOrderBook, IOrderBookSnapshot } from '../../../src/producers/coinbase/CoinbaseOrderBook';

// Mock the config to isolate the test from the global configuration
jest.mock('../../../src/config', () => ({
  botConfig: {
    exchanges: {
      coinbase: {
        details: {
          performance: {
            sequenceGapTolerance: 5,
          },
        },
      },
    },
  },
}));

// Mock the logger to avoid actual logging during tests
jest.mock('../../../src/services/logger.service', () => ({
  warn: jest.fn(),
}));

describe('CoinbaseOrderBook', () => {
  let orderBook: CoinbaseOrderBook;

  beforeEach(() => {
    orderBook = new CoinbaseOrderBook();
  });

  const mockSnapshot = (sequence: number): IOrderBookSnapshot => ({
    sequence,
    bids: [['50000', '1'], ['49999', '2']],
    asks: [['50001', '1.5'], ['50002', '2.5']],
  });

  it('should process a snapshot correctly', () => {
    const snapshot = mockSnapshot(100);
    orderBook.applySnapshot(snapshot);
    expect(orderBook.getBestBidAsk()).toEqual({
      bid: 50000,
      ask: 50001,
      spread: 1,
    });
  });

  it('should apply an update to the order book', () => {
    orderBook.applySnapshot(mockSnapshot(100));
    orderBook.applyUpdate({
      sequence: 101,
      changes: [['buy', '50000.5', '1']],
    });
    expect(orderBook.getBestBidAsk()).toEqual({
      bid: 50000.5,
      ask: 50001,
      spread: 0.5,
    });
  });

  it('should delete a price level when size is zero', () => {
    orderBook.applySnapshot(mockSnapshot(100));
    orderBook.applyUpdate({
      sequence: 101,
      changes: [['buy', '50000', '0']],
    });
    expect(orderBook.getBestBidAsk()).toEqual({
      bid: 49999,
      ask: 50001,
      spread: 2,
    });
  });

  it('should warn on out-of-sequence updates and not modify the book', () => {
    orderBook.applySnapshot(mockSnapshot(100));
    orderBook.applyUpdate({
      sequence: 99,
      changes: [['buy', '50000.5', '1']],
    });
    expect(orderBook.getBestBidAsk()).toEqual({
      bid: 50000,
      ask: 50001,
      spread: 1,
    });
  });

  it('should throw an error if a sequence gap is detected', () => {
    orderBook.applySnapshot(mockSnapshot(100));
    const { botConfig } = require('../../../src/config');
    expect(() => {
      orderBook.applyUpdate({
        sequence: 100 + botConfig.exchanges.coinbase.details.performance.sequenceGapTolerance + 1,
        changes: [],
      });
    }).toThrow('Sequence gap detected');
  });
});
