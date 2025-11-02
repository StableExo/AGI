"""
Tests for the Gas Price Monitoring Module
"""

import asyncio
import unittest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from datetime import datetime
from collections import deque

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.gas_optimization.gas_monitor import GasMonitor


class TestGasMonitor(unittest.TestCase):
    """Test suite for GasMonitor class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create a mock Web3 instance
        self.mock_web3 = Mock()
        self.mock_web3.eth = Mock()
        self.mock_web3.eth.gas_price = 50000000000  # 50 Gwei in Wei
        
        # Create GasMonitor instance with short update interval for testing
        self.monitor = GasMonitor(
            web3=self.mock_web3,
            update_interval=1,
            history_size=10,
            etherscan_api_key="test_api_key"
        )
    
    def tearDown(self):
        """Clean up after tests."""
        # Ensure monitoring is stopped
        if self.monitor.is_monitoring:
            asyncio.run(self.monitor.stop_monitoring())
    
    def test_initialization(self):
        """Test GasMonitor initialization."""
        monitor = GasMonitor(self.mock_web3, update_interval=15, history_size=100)
        
        self.assertEqual(monitor.web3, self.mock_web3)
        self.assertEqual(monitor.update_interval, 15)
        self.assertEqual(monitor.history_size, 100)
        self.assertIsInstance(monitor.gas_history, deque)
        self.assertEqual(len(monitor.gas_history), 0)
        self.assertFalse(monitor.is_monitoring)
    
    def test_wei_to_gwei_conversion(self):
        """Test Wei to Gwei conversion."""
        wei_value = 50000000000  # 50 Gwei
        gwei_value = GasMonitor.wei_to_gwei(wei_value)
        self.assertEqual(gwei_value, 50.0)
        
        # Test with different values
        self.assertEqual(GasMonitor.wei_to_gwei(1000000000), 1.0)
        self.assertEqual(GasMonitor.wei_to_gwei(0), 0.0)
    
    def test_gwei_to_wei_conversion(self):
        """Test Gwei to Wei conversion."""
        gwei_value = 50.0
        wei_value = GasMonitor.gwei_to_wei(gwei_value)
        self.assertEqual(wei_value, 50000000000)
        
        # Test with different values
        self.assertEqual(GasMonitor.gwei_to_wei(1.0), 1000000000)
        self.assertEqual(GasMonitor.gwei_to_wei(0.0), 0)
    
    @patch('asyncio.to_thread')
    async def test_get_current_gas_price_from_web3(self, mock_to_thread):
        """Test fetching gas price from Web3 provider."""
        expected_price = 45000000000  # 45 Gwei
        mock_to_thread.return_value = expected_price
        
        gas_price = await self.monitor.get_current_gas_price()
        
        self.assertEqual(gas_price, expected_price)
        mock_to_thread.assert_called_once()
    
    @patch('asyncio.to_thread')
    async def test_get_current_gas_price_fallback_to_api(self, mock_to_thread):
        """Test fallback to API when Web3 fails."""
        # Make Web3 fail
        mock_to_thread.side_effect = Exception("Web3 connection error")
        
        # Mock API response
        with patch.object(self.monitor, '_fetch_gas_from_api') as mock_api:
            expected_price = 40000000000  # 40 Gwei
            mock_api.return_value = expected_price
            
            gas_price = await self.monitor.get_current_gas_price()
            
            self.assertEqual(gas_price, expected_price)
            mock_api.assert_called_once()
    
    @patch('asyncio.to_thread')
    async def test_get_current_gas_price_default_fallback(self, mock_to_thread):
        """Test fallback to default when all sources fail."""
        # Make Web3 fail
        mock_to_thread.side_effect = Exception("Web3 connection error")
        
        # Make API fail
        with patch.object(self.monitor, '_fetch_gas_from_api') as mock_api:
            mock_api.return_value = None
            
            gas_price = await self.monitor.get_current_gas_price()
            
            # Should return default 50 Gwei
            expected_default = 50000000000
            self.assertEqual(gas_price, expected_default)
    
    async def test_fetch_gas_from_api_success(self):
        """Test successful API fetch."""
        mock_response_data = {
            "status": "1",
            "message": "OK",
            "result": {
                "SafeGasPrice": "30",
                "ProposeGasPrice": "35",
                "FastGasPrice": "40"
            }
        }
        
        with patch('aiohttp.ClientSession') as mock_session_class:
            # Setup mock response
            mock_response = MagicMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value=mock_response_data)
            mock_response.__aenter__ = AsyncMock(return_value=mock_response)
            mock_response.__aexit__ = AsyncMock()
            
            # Setup mock session
            mock_session = MagicMock()
            mock_session.get = MagicMock(return_value=mock_response)
            mock_session.__aenter__ = AsyncMock(return_value=mock_session)
            mock_session.__aexit__ = AsyncMock()
            
            mock_session_class.return_value = mock_session
            
            gas_price = await self.monitor._fetch_gas_from_api()
            
            # Should return ProposeGasPrice (35 Gwei) in Wei
            expected_price = 35000000000
            self.assertEqual(gas_price, expected_price)
    
    async def test_fetch_gas_from_api_error_status(self):
        """Test API fetch with error status."""
        mock_response_data = {
            "status": "0",
            "message": "NOTOK",
            "result": "Error message"
        }
        
        with patch('aiohttp.ClientSession') as mock_session_class:
            mock_response = MagicMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value=mock_response_data)
            mock_response.__aenter__ = AsyncMock(return_value=mock_response)
            mock_response.__aexit__ = AsyncMock()
            
            mock_session = MagicMock()
            mock_session.get = MagicMock(return_value=mock_response)
            mock_session.__aenter__ = AsyncMock(return_value=mock_session)
            mock_session.__aexit__ = AsyncMock()
            
            mock_session_class.return_value = mock_session
            
            gas_price = await self.monitor._fetch_gas_from_api()
            
            self.assertIsNone(gas_price)
    
    async def test_fetch_gas_from_api_timeout(self):
        """Test API fetch timeout handling."""
        with patch('aiohttp.ClientSession') as mock_session_class:
            mock_session = MagicMock()
            mock_session.get = MagicMock(side_effect=asyncio.TimeoutError())
            mock_session.__aenter__ = AsyncMock(return_value=mock_session)
            mock_session.__aexit__ = AsyncMock()
            
            mock_session_class.return_value = mock_session
            
            gas_price = await self.monitor._fetch_gas_from_api()
            
            self.assertIsNone(gas_price)
    
    def test_get_average_gas_price_with_data(self):
        """Test average calculation with sufficient data."""
        # Add some test data
        base_time = datetime.now()
        test_prices = [40, 45, 50, 55, 60]  # Gwei
        
        for i, price_gwei in enumerate(test_prices):
            price_wei = self.monitor.gwei_to_wei(price_gwei)
            self.monitor.gas_history.append((base_time, price_wei))
        
        # Calculate average of last 3 prices
        avg_price = self.monitor.get_average_gas_price(window=3)
        
        # Average of [50, 55, 60] = 55 Gwei
        expected_avg = 55000000000
        self.assertEqual(avg_price, expected_avg)
    
    def test_get_average_gas_price_full_window(self):
        """Test average calculation with full window."""
        # Add test data
        test_prices = [40, 42, 44, 46, 48, 50, 52, 54, 56, 58]  # 10 prices
        
        for price_gwei in test_prices:
            price_wei = self.monitor.gwei_to_wei(price_gwei)
            self.monitor.gas_history.append((datetime.now(), price_wei))
        
        # Calculate average of all 10 prices
        avg_price = self.monitor.get_average_gas_price(window=10)
        
        # Average of 40-58 (inclusive, step 2) = 49 Gwei
        expected_avg = 49000000000
        self.assertEqual(avg_price, expected_avg)
    
    def test_get_average_gas_price_no_data(self):
        """Test average calculation with no data."""
        avg_price = self.monitor.get_average_gas_price()
        self.assertIsNone(avg_price)
    
    def test_is_gas_price_favorable_below_threshold(self):
        """Test threshold check when price is below threshold."""
        # Add test data with price below threshold
        price_wei = self.monitor.gwei_to_wei(45)
        self.monitor.gas_history.append((datetime.now(), price_wei))
        
        is_favorable = self.monitor.is_gas_price_favorable(threshold_gwei=50)
        self.assertTrue(is_favorable)
    
    def test_is_gas_price_favorable_at_threshold(self):
        """Test threshold check when price is at threshold."""
        # Add test data with price at threshold
        price_wei = self.monitor.gwei_to_wei(50)
        self.monitor.gas_history.append((datetime.now(), price_wei))
        
        is_favorable = self.monitor.is_gas_price_favorable(threshold_gwei=50)
        self.assertTrue(is_favorable)
    
    def test_is_gas_price_favorable_above_threshold(self):
        """Test threshold check when price is above threshold."""
        # Add test data with price above threshold
        price_wei = self.monitor.gwei_to_wei(55)
        self.monitor.gas_history.append((datetime.now(), price_wei))
        
        is_favorable = self.monitor.is_gas_price_favorable(threshold_gwei=50)
        self.assertFalse(is_favorable)
    
    def test_is_gas_price_favorable_no_data(self):
        """Test threshold check with no data."""
        is_favorable = self.monitor.is_gas_price_favorable()
        self.assertFalse(is_favorable)
    
    def test_get_current_price_gwei(self):
        """Test getting current price in Gwei."""
        # Add test data
        price_wei = self.monitor.gwei_to_wei(47.5)
        self.monitor.gas_history.append((datetime.now(), price_wei))
        
        current_price = self.monitor.get_current_price_gwei()
        self.assertEqual(current_price, 47.5)
    
    def test_get_current_price_gwei_no_data(self):
        """Test getting current price with no data."""
        current_price = self.monitor.get_current_price_gwei()
        self.assertIsNone(current_price)
    
    def test_get_gas_history(self):
        """Test retrieving gas history."""
        # Add test data
        test_data = []
        for i in range(5):
            timestamp = datetime.now()
            price_wei = self.monitor.gwei_to_wei(40 + i)
            self.monitor.gas_history.append((timestamp, price_wei))
            test_data.append((timestamp, price_wei))
        
        history = self.monitor.get_gas_history()
        
        self.assertEqual(len(history), 5)
        self.assertEqual(history, test_data)
    
    def test_history_size_limit(self):
        """Test that history respects size limit."""
        # Monitor is configured with history_size=10
        # Add more than 10 entries
        for i in range(15):
            price_wei = self.monitor.gwei_to_wei(40 + i)
            self.monitor.gas_history.append((datetime.now(), price_wei))
        
        # Should only keep the last 10
        self.assertEqual(len(self.monitor.gas_history), 10)
        
        # Verify it kept the most recent ones (prices 45-54)
        prices = [self.monitor.wei_to_gwei(price) for _, price in self.monitor.gas_history]
        expected_prices = list(range(45, 55))
        self.assertEqual(prices, expected_prices)
    
    async def test_start_monitoring_basic(self):
        """Test starting the monitoring loop."""
        with patch.object(self.monitor, 'get_current_gas_price') as mock_get_price:
            mock_get_price.return_value = 45000000000  # 45 Gwei
            
            # Start monitoring in background
            monitor_task = asyncio.create_task(self.monitor.start_monitoring())
            
            # Wait for a few updates
            await asyncio.sleep(2.5)
            
            # Stop monitoring
            await self.monitor.stop_monitoring()
            
            try:
                await monitor_task
            except asyncio.CancelledError:
                pass
            
            # Should have collected some data points (at least 2)
            self.assertGreaterEqual(len(self.monitor.gas_history), 2)
            self.assertFalse(self.monitor.is_monitoring)
    
    async def test_start_monitoring_already_active(self):
        """Test that starting monitoring twice raises error."""
        self.monitor.is_monitoring = True
        
        with self.assertRaises(RuntimeError):
            await self.monitor.start_monitoring()
        
        self.monitor.is_monitoring = False
    
    async def test_stop_monitoring_not_active(self):
        """Test stopping monitoring when not active."""
        # Should not raise error, just log warning
        await self.monitor.stop_monitoring()
        self.assertFalse(self.monitor.is_monitoring)
    
    async def test_monitoring_error_handling(self):
        """Test that monitoring continues after errors."""
        call_count = 0
        
        async def mock_get_price_with_error():
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise Exception("Temporary error")
            return 45000000000
        
        with patch.object(self.monitor, 'get_current_gas_price', side_effect=mock_get_price_with_error):
            # Start monitoring
            monitor_task = asyncio.create_task(self.monitor.start_monitoring())
            
            # Wait for a few updates
            await asyncio.sleep(2.5)
            
            # Stop monitoring
            await self.monitor.stop_monitoring()
            
            try:
                await monitor_task
            except asyncio.CancelledError:
                pass
            
            # Should have at least one successful data point (after the error)
            self.assertGreaterEqual(len(self.monitor.gas_history), 1)
            # Should have attempted multiple calls
            self.assertGreaterEqual(call_count, 2)


def run_async_test(coro):
    """Helper function to run async tests."""
    return asyncio.run(coro)


# Make async tests runnable with unittest
for name, method in list(TestGasMonitor.__dict__.items()):
    if name.startswith('test_') and asyncio.iscoroutinefunction(method):
        # Wrap async test method
        def make_sync_test(async_method):
            def sync_test(self):
                return run_async_test(async_method(self))
            return sync_test
        
        setattr(TestGasMonitor, name, make_sync_test(method))


if __name__ == '__main__':
    unittest.main()
