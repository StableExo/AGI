export interface MarketDataEvent {
  // Core Identification
  schema_version: '2.0.0'
  event_id: string  // UUIDv4 for deduplication
  exchange: 'btcc' | 'binance' | 'kraken' | 'coinbase'
  symbol: string    // Normalized: 'BTC/USDT'

  // Pricing Matrix
  bid: {
    price: number
    quantity: number
    liquidity: number  // Order book depth
  }
  ask: {
    price: number
    quantity: number
    liquidity: number
  }

  // Market Context
  spread: number
  spread_bps: number
  volume_24h: number
  funding_rate?: number  // For perpetuals

  // Temporal Precision
  exchange_timestamp: number  // Original exchange timestamp
  processing_timestamp: number  // Our system timestamp
  latency_ms: number  // Processing latency

  // Message Metadata
  sequence_id: number  // For gap detection
  is_snapshot: boolean  // Snapshot vs incremental
}
