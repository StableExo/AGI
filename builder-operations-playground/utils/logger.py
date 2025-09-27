import os
import datetime

def log_mission_success(mission_name, message):
    """
    Logs a successful mission completion to the learning log.

    Args:
        mission_name (str): The name of the mission that was completed.
        message (str): The message to log.
    """
    log_file_path = "ai-knowledge-base/learning_log.md"
    timestamp = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    log_entry = f"\n{timestamp} - {mission_name}: Success. {message}"

    # Ensure the directory exists
    os.makedirs(os.path.dirname(log_file_path), exist_ok=True)

    with open(log_file_path, "a") as log_file:
        log_file.write(log_entry)