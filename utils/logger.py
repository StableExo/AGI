import os
import datetime
import logging

def get_logger(name, level=None):
    """
    Initializes and returns a standardized logger for console output.

    Args:
        name (str): The name for the logger, typically __name__.
        level (str, optional): The logging level ('DEBUG', 'INFO', 'WARNING', 'ERROR').
                               Defaults to the LOG_LEVEL environment variable or 'INFO'.

    Returns:
        logging.Logger: A configured logger instance.
    """
    # Determine log level from environment variable or default to INFO
    log_level_str = level or os.getenv('LOG_LEVEL', 'INFO').upper()
    log_level = getattr(logging, log_level_str, logging.INFO)

    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(log_level)

    # Prevent duplicate handlers if the logger is already configured
    if not logger.handlers:
        # Create console handler
        ch = logging.StreamHandler()
        ch.setLevel(log_level)

        # Create formatter and add it to the handler
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        ch.setFormatter(formatter)

        # Add the handler to the logger
        logger.addHandler(ch)

    return logger

def log_mission_success(message):
    """
    Logs a successful mission completion to the learning log.

    Args:
        message (str): The message to log.
    """
    log_file_path = "ai-knowledge-base/learning_log.md"
    timestamp = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    log_entry = f"\n{timestamp} - {message}"

    # Ensure the directory exists
    os.makedirs(os.path.dirname(log_file_path), exist_ok=True)

    with open(log_file_path, "a") as log_file:
        log_file.write(log_entry)