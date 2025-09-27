import os
from datetime import datetime

def log_mission_success(mission_name):
    """
    Logs a successful mission completion to the learning log.

    Args:
        mission_name (str): The name of the mission that was completed.
    """
    log_file_path = "ai-knowledge-base/learning_log.md"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"{timestamp} - Mission {mission_name}: Success. Implemented centralized logging module as per self-generated plan.\n"

    # Ensure the directory exists
    os.makedirs(os.path.dirname(log_file_path), exist_ok=True)

    with open(log_file_path, "a") as log_file:
        log_file.write(log_entry)