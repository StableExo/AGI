from utils.logger import get_logger

# Get a logger instance for this module
log = get_logger(__name__)

class AGIError(Exception):
    """
    Custom base exception class for the AGI project.
    Allows for categorization of application-specific errors.
    """
    def __init__(self, message, error_type="General"):
        self.message = message
        self.error_type = error_type
        super().__init__(f"[{self.error_type}] {self.message}")

def handle_error(error, context="General", exit_on_error=False):
    """
    Centralized error handling function.

    Logs the error with context and can optionally terminate the application.

    Args:
        error (Exception): The error that was caught.
        context (str): A string describing the context in which the error occurred.
        exit_on_error (bool): If True, the application will exit after logging the error.
    """
    if isinstance(error, AGIError):
        # Log custom errors with their specific type
        log.error(f"An AGIError occurred in {context}: {error}", exc_info=True)
    else:
        # Log standard exceptions
        log.error(f"An unexpected error occurred in {context}: {error}", exc_info=True)

    if exit_on_error:
        log.critical(f"Exiting due to a critical error in {context}.")
        exit(1)