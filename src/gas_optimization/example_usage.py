"""
Example usage of the GasMonitor module.

This script demonstrates how to use the GasMonitor to track gas prices
and make decisions about transaction timing.
"""

import asyncio
import logging
from web3 import Web3

from gas_monitor import GasMonitor

# Configure logging to see what's happening
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


async def main():
    """Main example function demonstrating GasMonitor usage."""
    
    # Connect to an Ethereum node (you'll need a real RPC endpoint)
    # For this example, we'll use a mock/local endpoint
    # In production, use: Web3(Web3.HTTPProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID'))
    web3 = Web3(Web3.HTTPProvider('http://localhost:8545'))
    
    # Initialize the GasMonitor
    # - update_interval: check gas price every 15 seconds
    # - history_size: keep last 100 readings
    # - etherscan_api_key: optional, for fallback API access
    monitor = GasMonitor(
        web3=web3,
        update_interval=15,
        history_size=100,
        etherscan_api_key=None  # Add your key here if you have one
    )
    
    logger.info("=== Gas Monitor Example ===")
    
    # Example 1: Get a single gas price reading
    logger.info("\n1. Fetching current gas price...")
    try:
        current_price = await monitor.get_current_gas_price()
        current_gwei = monitor.wei_to_gwei(current_price)
        logger.info(f"   Current gas price: {current_gwei:.2f} Gwei ({current_price} Wei)")
    except Exception as e:
        logger.error(f"   Failed to get gas price: {e}")
    
    # Example 2: Start monitoring in the background
    logger.info("\n2. Starting background monitoring for 30 seconds...")
    monitor_task = asyncio.create_task(monitor.start_monitoring())
    
    # Wait for some data to accumulate
    await asyncio.sleep(30)
    
    # Example 3: Check historical data
    logger.info("\n3. Analyzing historical data...")
    history = monitor.get_gas_history()
    logger.info(f"   Collected {len(history)} readings")
    
    if history:
        # Get current price
        current_gwei = monitor.get_current_price_gwei()
        logger.info(f"   Current price: {current_gwei:.2f} Gwei")
        
        # Get average over last 10 readings
        avg_price = monitor.get_average_gas_price(window=10)
        if avg_price:
            avg_gwei = monitor.wei_to_gwei(avg_price)
            logger.info(f"   10-reading average: {avg_gwei:.2f} Gwei")
    
    # Example 4: Check if gas price is favorable for trading
    logger.info("\n4. Checking if gas price is favorable...")
    threshold_gwei = 50  # Only trade if gas is below 50 Gwei
    
    is_favorable = monitor.is_gas_price_favorable(threshold_gwei=threshold_gwei)
    
    if is_favorable:
        logger.info(f"   ✓ Gas price is favorable (below {threshold_gwei} Gwei)")
        logger.info("   This would be a good time to execute trades")
    else:
        logger.info(f"   ✗ Gas price is too high (above {threshold_gwei} Gwei)")
        logger.info("   Consider waiting for lower gas prices")
    
    # Example 5: Calculate trends
    if len(history) >= 2:
        logger.info("\n5. Analyzing price trends...")
        recent_prices = [monitor.wei_to_gwei(price) for _, price in history[-5:]]
        logger.info(f"   Last 5 prices: {[f'{p:.2f}' for p in recent_prices]}")
        
        if recent_prices[-1] < recent_prices[0]:
            logger.info("   Trend: Gas prices are decreasing ↓")
        elif recent_prices[-1] > recent_prices[0]:
            logger.info("   Trend: Gas prices are increasing ↑")
        else:
            logger.info("   Trend: Gas prices are stable →")
    
    # Stop monitoring
    logger.info("\n6. Stopping monitoring...")
    await monitor.stop_monitoring()
    
    try:
        await monitor_task
    except asyncio.CancelledError:
        pass
    
    logger.info("\n=== Example Complete ===")


if __name__ == "__main__":
    # Run the example
    asyncio.run(main())
