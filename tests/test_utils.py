import unittest
import logging
from unittest.mock import patch, MagicMock

# It's good practice to ensure the utils path is in the system path
# for testing, although in many setups it might work without it.
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from utils.logger import get_logger, log_mission_success
from utils.error_handler import AGIError, handle_error

class TestLogger(unittest.TestCase):

    @patch('builtins.open')
    @patch('os.makedirs')
    def test_log_mission_success(self, mock_makedirs, mock_open):
        """Test that log_mission_success writes the correct message to the log file."""
        mock_file = MagicMock()
        mock_open.return_value.__enter__.return_value = mock_file

        test_message = "Test mission complete"
        log_mission_success(test_message)

        # Verify that os.makedirs was called to ensure the directory exists
        mock_makedirs.assert_called_once_with("ai-knowledge-base", exist_ok=True)

        # Verify that the file was opened in append mode
        mock_open.assert_called_once_with("ai-knowledge-base/learning_log.md", "a")

        # Verify that the correct message was written to the file
        # We check that the written string contains the message, ignoring the timestamp
        written_content = mock_file.write.call_args[0][0]
        self.assertIn(test_message, written_content)
        self.assertTrue(written_content.startswith('\n')) # Should start with a newline

    def test_get_logger_basic(self):
        """Test that a logger can be created with a specific name."""
        logger_name = "test_logger_1"
        logger = get_logger(logger_name)
        self.assertIsInstance(logger, logging.Logger)
        self.assertEqual(logger.name, logger_name)
        self.assertEqual(logger.level, logging.INFO) # Default level

    def test_get_logger_debug_level(self):
        """Test that a logger can be created with a DEBUG level."""
        logger_name = "test_logger_debug"
        logger = get_logger(logger_name, level='DEBUG')
        self.assertEqual(logger.level, logging.DEBUG)

    def test_logger_singleton_behavior(self):
        """Test that getting the same logger returns the same instance."""
        logger_name = "singleton_logger"
        logger1 = get_logger(logger_name)
        logger2 = get_logger(logger_name)
        self.assertIs(logger1, logger2)
        # Ensure handlers are not added multiple times
        self.assertEqual(len(logger1.handlers), 1)

class TestErrorHandler(unittest.TestCase):

    @patch('utils.error_handler.log')
    def test_handle_error_agi_error(self, mock_log):
        """Test that AGIError is logged correctly."""
        error = AGIError("Test AGI Error", error_type="TestType")
        handle_error(error, context="TestContext")

        # Check that log.error was called
        mock_log.error.assert_called_once()
        # Check the content of the log call
        call_args, call_kwargs = mock_log.error.call_args
        self.assertIn("An AGIError occurred in TestContext", call_args[0])
        self.assertIn("[TestType] Test AGI Error", call_args[0])
        self.assertTrue(call_kwargs['exc_info'])

    @patch('utils.error_handler.log')
    def test_handle_error_standard_exception(self, mock_log):
        """Test that a standard Exception is logged correctly."""
        error = ValueError("Standard value error")
        handle_error(error, context="StandardTest")

        mock_log.error.assert_called_once()
        call_args, call_kwargs = mock_log.error.call_args
        self.assertIn("An unexpected error occurred in StandardTest", call_args[0])
        self.assertIn("Standard value error", call_args[0])
        self.assertTrue(call_kwargs['exc_info'])

    @patch('utils.error_handler.log')
    @patch('utils.error_handler.exit')
    def test_handle_error_exit_on_error(self, mock_exit, mock_log):
        """Test that the application exits when exit_on_error is True."""
        error = RuntimeError("Critical failure")
        handle_error(error, context="CriticalContext", exit_on_error=True)

        mock_log.error.assert_called_once()
        mock_log.critical.assert_called_once_with("Exiting due to a critical error in CriticalContext.")
        mock_exit.assert_called_once_with(1)

if __name__ == '__main__':
    unittest.main()