import { botConfig } from '../../config';
import logger from '../../services/logger.service';

export interface IOrderBookSnapshot {
  sequence: number;
  bids: [string, string][];
  asks: [string, string][];
}

export interface IL2Update {
  sequence: number;
  changes: ['buy' | 'sell', string, string][];
}

export class CoinbaseOrderBook {
  private bids: Map<string, string> = new Map() // price -> size
  private asks: Map<string, string> = new Map()
  private sequence: number = 0
  private lastSequence: number = 0

  public applySnapshot(snapshot: IOrderBookSnapshot) {
    this.bids.clear()
    this.asks.clear()

    snapshot.bids.forEach(([price, size]: [string, string]) => {
      if (parseFloat(size) > 0) this.bids.set(price, size)
    })

    snapshot.asks.forEach(([price, size]: [string, string]) => {
      if (parseFloat(size) > 0) this.asks.set(price, size)
    })

    this.sequence = snapshot.sequence
    this.lastSequence = this.sequence
  }

  public applyUpdate(update: IL2Update) {
    // Sequence validation for data integrity
    if (update.sequence <= this.lastSequence) {
      logger.warn(`Out-of-sequence message: ${update.sequence} vs ${this.lastSequence}`)
      return
    }

    if (update.sequence > this.lastSequence + botConfig.exchanges.coinbase.details.performance.sequenceGapTolerance) {
      throw new Error(`Sequence gap detected: ${update.sequence} vs ${this.lastSequence}`);
    }

    update.changes.forEach(([side, price, size]: ['buy' | 'sell', string, string]) => {
      const map = side === 'buy' ? this.bids : this.asks

      if (parseFloat(size) === 0) {
        map.delete(price)
      } else {
        map.set(price, size)
      }
    })

    this.lastSequence = update.sequence
  }

  public getBestBidAsk(): { bid: number; ask: number; spread: number } {
    const bids = Array.from(this.bids.keys()).map(parseFloat);
    const asks = Array.from(this.asks.keys()).map(parseFloat);

    if (bids.length === 0 || asks.length === 0) {
      return { bid: 0, ask: 0, spread: 0 };
    }

    const bestBid = Math.max(...bids);
    const bestAsk = Math.min(...asks);

    return {
      bid: bestBid,
      ask: bestAsk,
      spread: bestAsk - bestBid
    }
  }
}
