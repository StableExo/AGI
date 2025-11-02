"""
Gas Price Monitoring Module

This module provides comprehensive gas price monitoring for blockchain transactions,
fetching real-time gas prices from multiple sources and tracking historical data
to help make informed trading decisions.
"""

import asyncio
import logging
from typing import Optional, List, Tuple
from datetime import datetime
from collections import deque

import aiohttp
from web3 import Web3


# Configure module logger
logger = logging.getLogger(__name__)


class GasMonitor:
    """
    Monitors and tracks gas prices from multiple sources.
    
    This class provides real-time gas price monitoring with historical tracking,
    moving averages, and threshold checking to help determine optimal transaction timing.
    
    Attributes:
        web3: Web3 instance for blockchain interactions
        update_interval: Seconds between gas price updates
        history_size: Maximum number of historical readings to store
        gas_history: Deque of (timestamp, price_wei) tuples
        is_monitoring: Flag indicating if monitoring loop is active
    """
    
    # Etherscan API endpoint for gas oracle
    ETHERSCAN_GAS_ORACLE_URL = "https://api.etherscan.io/api?module=gastracker&action=gasoracle"
    
    def __init__(
        self, 
        web3: Web3, 
        update_interval: int = 15,
        history_size: int = 100,
        etherscan_api_key: Optional[str] = None
    ):
        """
        Initialize the GasMonitor.
        
        Args:
            web3: Web3 instance connected to an Ethereum node
            update_interval: Seconds between gas price updates (default: 15)
            history_size: Maximum number of historical readings to store (default: 100)
            etherscan_api_key: Optional Etherscan API key for gas oracle access
        """
        self.web3 = web3
        self.update_interval = update_interval
        self.history_size = history_size
        self.etherscan_api_key = etherscan_api_key
        
        # Historical data storage: (timestamp, price_in_wei)
        self.gas_history: deque = deque(maxlen=history_size)
        
        # Monitoring state
        self.is_monitoring = False
        self._monitor_task: Optional[asyncio.Task] = None
        
        logger.info(
            f"GasMonitor initialized with update_interval={update_interval}s, "
            f"history_size={history_size}"
        )
    
    async def start_monitoring(self) -> None:
        """
        Start the async gas price monitoring loop.
        
        This method starts a background task that continuously fetches and stores
        gas prices at the configured update interval. The monitoring runs until
        stopped or an unrecoverable error occurs.
        
        Raises:
            RuntimeError: If monitoring is already active
        """
        if self.is_monitoring:
            raise RuntimeError("Gas monitoring is already active")
        
        self.is_monitoring = True
        logger.info("Starting gas price monitoring")
        
        try:
            while self.is_monitoring:
                try:
                    # Fetch current gas price
                    gas_price = await self.get_current_gas_price()
                    
                    # Store with timestamp
                    timestamp = datetime.now()
                    self.gas_history.append((timestamp, gas_price))
                    
                    gas_gwei = self.wei_to_gwei(gas_price)
                    logger.debug(
                        f"Gas price updated: {gas_gwei:.2f} Gwei "
                        f"(history size: {len(self.gas_history)})"
                    )
                    
                except Exception as e:
                    logger.error(f"Error in monitoring loop: {e}", exc_info=True)
                
                # Wait before next update
                await asyncio.sleep(self.update_interval)
                
        except asyncio.CancelledError:
            logger.info("Gas monitoring cancelled")
            raise
        finally:
            self.is_monitoring = False
    
    async def stop_monitoring(self) -> None:
        """
        Stop the gas price monitoring loop.
        
        This method gracefully stops the monitoring task if it's running.
        """
        if not self.is_monitoring:
            logger.warning("Gas monitoring is not active")
            return
        
        logger.info("Stopping gas price monitoring")
        self.is_monitoring = False
        
        if self._monitor_task and not self._monitor_task.done():
            self._monitor_task.cancel()
            try:
                await self._monitor_task
            except asyncio.CancelledError:
                pass
    
    async def get_current_gas_price(self) -> int:
        """
        Get the current gas price from available sources.
        
        Attempts to fetch gas price from multiple sources in order of preference:
        1. Web3 provider (direct blockchain query)
        2. Etherscan Gas Oracle API
        3. Default fallback value
        
        Returns:
            int: Current gas price in Wei
        """
        # Try Web3 provider first
        try:
            gas_price = await asyncio.to_thread(self.web3.eth.gas_price)
            logger.debug(f"Gas price from Web3: {self.wei_to_gwei(gas_price):.2f} Gwei")
            return gas_price
        except Exception as e:
            logger.warning(f"Failed to get gas price from Web3: {e}")
        
        # Try Etherscan API as fallback
        try:
            api_gas_price = await self._fetch_gas_from_api()
            if api_gas_price:
                logger.debug(f"Gas price from API: {self.wei_to_gwei(api_gas_price):.2f} Gwei")
                return api_gas_price
        except Exception as e:
            logger.warning(f"Failed to get gas price from API: {e}")
        
        # Final fallback: return a conservative default (50 Gwei)
        default_price = self.gwei_to_wei(50)
        logger.warning(f"Using default gas price: {self.wei_to_gwei(default_price):.2f} Gwei")
        return default_price
    
    async def _fetch_gas_from_api(self) -> Optional[int]:
        """
        Fetch gas price from Etherscan Gas Oracle API.
        
        Returns:
            Optional[int]: Gas price in Wei, or None if fetch fails
        """
        url = self.ETHERSCAN_GAS_ORACLE_URL
        if self.etherscan_api_key:
            url += f"&apikey={self.etherscan_api_key}"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status != 200:
                        logger.warning(f"Etherscan API returned status {response.status}")
                        return None
                    
                    data = await response.json()
                    
                    # Check for API error
                    if data.get("status") != "1":
                        logger.warning(f"Etherscan API error: {data.get('message')}")
                        return None
                    
                    # Extract recommended gas price (in Gwei)
                    result = data.get("result", {})
                    # Use "ProposeGasPrice" or "SafeGasPrice" as recommended price
                    gas_gwei = float(result.get("ProposeGasPrice", result.get("SafeGasPrice", 0)))
                    
                    if gas_gwei > 0:
                        return self.gwei_to_wei(gas_gwei)
                    
                    return None
                    
        except asyncio.TimeoutError:
            logger.warning("Timeout fetching gas price from Etherscan API")
            return None
        except Exception as e:
            logger.error(f"Error fetching gas price from API: {e}", exc_info=True)
            return None
    
    def get_average_gas_price(self, window: int = 10) -> Optional[int]:
        """
        Calculate average gas price over a recent window.
        
        Args:
            window: Number of recent readings to average (default: 10)
        
        Returns:
            Optional[int]: Average gas price in Wei, or None if insufficient data
        """
        if not self.gas_history:
            logger.debug("No gas history available for average calculation")
            return None
        
        # Get the most recent 'window' readings
        recent_prices = list(self.gas_history)[-window:]
        
        if not recent_prices:
            return None
        
        # Calculate average (prices are in Wei)
        avg_price = sum(price for _, price in recent_prices) // len(recent_prices)
        
        logger.debug(
            f"Average gas price over {len(recent_prices)} readings: "
            f"{self.wei_to_gwei(avg_price):.2f} Gwei"
        )
        
        return avg_price
    
    def is_gas_price_favorable(self, threshold_gwei: float = 50) -> bool:
        """
        Check if current gas price is below the specified threshold.
        
        Args:
            threshold_gwei: Maximum acceptable gas price in Gwei (default: 50)
        
        Returns:
            bool: True if current gas price is at or below threshold, False otherwise
        """
        if not self.gas_history:
            logger.warning("No gas history available for threshold check")
            return False
        
        # Get most recent gas price
        _, current_price_wei = self.gas_history[-1]
        current_price_gwei = self.wei_to_gwei(current_price_wei)
        
        is_favorable = current_price_gwei <= threshold_gwei
        
        logger.debug(
            f"Gas price check: {current_price_gwei:.2f} Gwei "
            f"{'<=' if is_favorable else '>'} {threshold_gwei} Gwei threshold"
        )
        
        return is_favorable
    
    def get_current_price_gwei(self) -> Optional[float]:
        """
        Get the most recent gas price in Gwei.
        
        Returns:
            Optional[float]: Most recent gas price in Gwei, or None if no data available
        """
        if not self.gas_history:
            return None
        
        _, price_wei = self.gas_history[-1]
        return self.wei_to_gwei(price_wei)
    
    def get_gas_history(self) -> List[Tuple[datetime, int]]:
        """
        Get the complete gas price history.
        
        Returns:
            List[Tuple[datetime, int]]: List of (timestamp, price_wei) tuples
        """
        return list(self.gas_history)
    
    @staticmethod
    def wei_to_gwei(wei: int) -> float:
        """
        Convert Wei to Gwei.
        
        Args:
            wei: Amount in Wei
        
        Returns:
            float: Amount in Gwei
        """
        return wei / 1e9
    
    @staticmethod
    def gwei_to_wei(gwei: float) -> int:
        """
        Convert Gwei to Wei.
        
        Args:
            gwei: Amount in Gwei
        
        Returns:
            int: Amount in Wei
        """
        return int(gwei * 1e9)
