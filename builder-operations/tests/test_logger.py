import sys
import os
import unittest
from unittest.mock import patch, mock_open

# Add the parent directory of 'tests' to the Python path.
# This is the 'builder-operations-playground' directory.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from utils.logger import log_mission_success

class TestLogger(unittest.TestCase):

    @patch('utils.logger.os.makedirs')
    @patch('utils.logger.open', new_callable=mock_open)
    def test_import_and_call_logger_without_writing(self, mock_file_open, mock_makedirs):
        """
        Tests that log_mission_success can be imported and called.
        This verifies that the sys.path modification is working correctly.
        Mocks the file operations to prevent actual file I/O during the test.
        """
        try:
            log_mission_success("A test message that will not be logged.")
        except Exception as e:
            self.fail(f"log_mission_success failed to execute: {e}")

        # Verify that the directory creation was attempted.
        mock_makedirs.assert_called_once()
        # Verify that the open function was called on the correct file path.
        mock_file_open.assert_called_once_with("ai-knowledge-base/learning_log.md", "a")
        # Verify that something was written to the mock file handle.
        mock_file_open().write.assert_called_once()

if __name__ == '__main__':
    unittest.main()