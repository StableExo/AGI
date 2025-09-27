import sys
import os
import pytest

# Add the parent directory to the path to allow for relative imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from utils.logger import log_mission_success


def test_log_function_runs():
    """
    Tests that the log_mission_success function runs without raising an exception.
    """
    try:
        log_mission_success("TEST", "This is a test log.")
    except Exception as e:
        pytest.fail(f"log_mission_success raised an exception unexpectedly: {e}")