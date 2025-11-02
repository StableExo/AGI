# Gas Optimization Module

A comprehensive gas price monitoring module for Ethereum blockchain that tracks real-time gas prices from multiple sources and helps make informed decisions about when to execute trades.

## Features

- **Multi-source Gas Price Fetching**: Retrieves gas prices from:
  - Web3 provider (direct blockchain query)
  - Etherscan Gas Oracle API
  - Automatic fallback to default values if sources fail

- **Historical Tracking**: 
  - Stores recent gas price history (configurable, default: last 100 readings)
  - Timestamped entries for trend analysis
  - Automatic size management with deque

- **Statistical Analysis**:
  - Moving averages over configurable windows
  - Trend detection capabilities
  - Threshold-based decision support

- **Real-time Monitoring**:
  - Async monitoring loop with configurable update intervals
  - Non-blocking implementation using asyncio
  - Graceful error handling and recovery

- **Utilities**:
  - Wei/Gwei conversion helpers
  - Current price queries in multiple formats
  - Complete history access

## Installation

### Dependencies

Add the following to your `requirements.txt`:

```
web3>=6.0.0
aiohttp>=3.9.4
```

Install with:

```bash
pip install web3>=6.0.0 aiohttp>=3.9.4
```

## Quick Start

### Basic Usage

```python
import asyncio
from web3 import Web3
from src.gas_optimization import GasMonitor

async def main():
    # Connect to Ethereum node
    web3 = Web3(Web3.HTTPProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID'))
    
    # Initialize monitor
    monitor = GasMonitor(
        web3=web3,
        update_interval=15,  # Check every 15 seconds
        history_size=100,    # Keep last 100 readings
        etherscan_api_key="YOUR-ETHERSCAN-API-KEY"  # Optional
    )
    
    # Get current gas price
    current_price = await monitor.get_current_gas_price()
    print(f"Current gas price: {monitor.wei_to_gwei(current_price):.2f} Gwei")
    
    # Check if gas is favorable for trading
    if monitor.is_gas_price_favorable(threshold_gwei=50):
        print("Gas price is favorable - execute trades!")
    else:
        print("Gas price is too high - wait for better conditions")

asyncio.run(main())
```

### Continuous Monitoring

```python
import asyncio
from web3 import Web3
from src.gas_optimization import GasMonitor

async def monitor_gas_prices():
    web3 = Web3(Web3.HTTPProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID'))
    monitor = GasMonitor(web3=web3, update_interval=15)
    
    # Start monitoring in background
    monitor_task = asyncio.create_task(monitor.start_monitoring())
    
    # Let it collect data for a while
    await asyncio.sleep(60)
    
    # Analyze collected data
    avg_price = monitor.get_average_gas_price(window=10)
    if avg_price:
        print(f"Average gas price (last 10): {monitor.wei_to_gwei(avg_price):.2f} Gwei")
    
    # Get history for custom analysis
    history = monitor.get_gas_history()
    print(f"Collected {len(history)} readings")
    
    # Stop monitoring
    await monitor.stop_monitoring()
    await monitor_task

asyncio.run(monitor_gas_prices())
```

## API Reference

### GasMonitor Class

#### Constructor

```python
GasMonitor(
    web3: Web3,
    update_interval: int = 15,
    history_size: int = 100,
    etherscan_api_key: Optional[str] = None
)
```

**Parameters:**
- `web3`: Web3 instance connected to an Ethereum node
- `update_interval`: Seconds between gas price updates (default: 15)
- `history_size`: Maximum number of historical readings to store (default: 100)
- `etherscan_api_key`: Optional Etherscan API key for gas oracle access

#### Methods

##### `async start_monitoring() -> None`

Start the async gas price monitoring loop. Continuously fetches and stores gas prices at the configured interval.

**Raises:**
- `RuntimeError`: If monitoring is already active

##### `async stop_monitoring() -> None`

Stop the gas price monitoring loop gracefully.

##### `async get_current_gas_price() -> int`

Get the current gas price from available sources (Web3 → Etherscan API → default).

**Returns:** Current gas price in Wei

##### `get_average_gas_price(window: int = 10) -> Optional[int]`

Calculate average gas price over a recent window.

**Parameters:**
- `window`: Number of recent readings to average (default: 10)

**Returns:** Average gas price in Wei, or None if insufficient data

##### `is_gas_price_favorable(threshold_gwei: float = 50) -> bool`

Check if current gas price is below the specified threshold.

**Parameters:**
- `threshold_gwei`: Maximum acceptable gas price in Gwei (default: 50)

**Returns:** True if current price is at or below threshold

##### `get_current_price_gwei() -> Optional[float]`

Get the most recent gas price in Gwei.

**Returns:** Most recent gas price in Gwei, or None if no data

##### `get_gas_history() -> List[Tuple[datetime, int]]`

Get the complete gas price history.

**Returns:** List of (timestamp, price_wei) tuples

##### Static Methods

```python
wei_to_gwei(wei: int) -> float
```
Convert Wei to Gwei.

```python
gwei_to_wei(gwei: float) -> int
```
Convert Gwei to Wei.

## Configuration

### Environment Variables

While not required, you may want to configure:

- `ETHERSCAN_API_KEY`: Your Etherscan API key for higher rate limits
- `WEB3_PROVIDER_URI`: Default Web3 provider endpoint

### Logging

The module uses Python's standard logging. Configure it in your application:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# For debug output
logging.getLogger('src.gas_optimization.gas_monitor').setLevel(logging.DEBUG)
```

## Error Handling

The module implements comprehensive error handling:

- **Web3 Connection Failures**: Automatically falls back to Etherscan API
- **API Failures**: Falls back to conservative default value (50 Gwei)
- **Monitoring Loop Errors**: Logs errors and continues monitoring
- **Timeout Protection**: All network requests have timeout limits

## Best Practices

1. **API Keys**: Use an Etherscan API key to avoid rate limiting
2. **Update Interval**: Balance between freshness and API limits (15-30 seconds recommended)
3. **History Size**: Adjust based on memory constraints and analysis needs
4. **Threshold Values**: Set based on current network conditions and profit margins
5. **Error Monitoring**: Check logs regularly for connection issues

## Testing

Run the test suite:

```bash
python -m pytest tests/test_gas_monitor.py -v
```

The module includes 24 comprehensive tests covering:
- Gas price fetching from multiple sources
- Historical data management
- Average calculations
- Threshold checking
- Error handling scenarios
- Async monitoring behavior

## Security

- ✅ All dependencies use secure versions (aiohttp>=3.9.4)
- ✅ Proper timeout handling on all network requests
- ✅ No secrets logged or exposed
- ✅ CodeQL security analysis passed with 0 vulnerabilities

## Performance Considerations

- Uses `asyncio` for non-blocking operations
- Efficient deque for O(1) append/pop operations
- Minimal memory footprint with configurable history size
- No blocking calls in monitoring loop

## Troubleshooting

### Issue: "No gas history available"
**Solution**: Start monitoring and wait for at least one update cycle.

### Issue: "Web3 connection error"
**Solution**: Verify your Web3 provider endpoint is accessible and has sufficient rate limits.

### Issue: "Etherscan API error"
**Solution**: Check your API key is valid or increase the update interval to avoid rate limits.

### Issue: Monitoring stops unexpectedly
**Solution**: Check logs for errors. Ensure network connectivity is stable.

## Contributing

When contributing to this module:

1. Add tests for new features
2. Update documentation
3. Follow existing code style
4. Ensure all tests pass
5. Run security checks

## License

This module is part of the Mnemosyne AGI project.

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing tests for usage examples
- Review the example_usage.py script
