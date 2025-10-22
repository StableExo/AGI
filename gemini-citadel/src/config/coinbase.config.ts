export const CoinbaseConfig = {
  // WebSocket Configuration
  websocket: {
    url: process.env.COINBASE_WS_URL || 'wss://ws-feed.pro.coinbase.com',
    reconnectAttempts: 5,
    heartbeatInterval: 30000
  },

  // Initial Symbol Universe - Phase 1
  symbols: {
    primary: ['BTC-USD', 'ETH-USD', 'BTC-USDT', 'ETH-USDT'],
    secondary: ['SOL-USD', 'ADA-USD', 'DOT-USD', 'LTC-USD'],
    stablecoins: ['USDC-USD', 'DAI-USD']
  },

  // Kafka Topics
  topics: {
    raw: 'market-data.raw.coinbase',
    normalized: 'market-data.normalized'
  },

  // Performance Thresholds
  performance: {
    maxLatencyMs: 50,
    maxReconnectDelay: 30000,
    sequenceGapTolerance: 5
  }
} as const

// Environment Validation
export const validateCoinbaseConfig = () => {
  if (!CoinbaseConfig.websocket.url) {
    throw new Error('COINBASE_WS_URL environment variable is required')
  }
}
