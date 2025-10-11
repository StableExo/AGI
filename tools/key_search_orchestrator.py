#!/usr/bin/env python3

import logging
import os
import sys
import time
from datetime import datetime

from candidate_key_generator import generate_candidate_key
from address_deriver import derive_address

# --- Constants ---
TARGET_ADDRESS_FILE = "TARGET_ADDRESS.txt"
STATE_FILE = "key_search.state"
LOG_FILE = "key_search.log"

# --- Configuration ---
LOG_FORMAT = '%(asctime)s - %(levelname)s - %(message)s'
STATE_SAVE_INTERVAL = 1000  # Save progress every 1000 keys
LOG_INTERVAL = 100000     # Log progress every 100,000 keys

def setup_logging():
    """Configures structured logging to both file and console."""
    logging.basicConfig(
        level=logging.INFO,
        format=LOG_FORMAT,
        handlers=[
            logging.FileHandler(LOG_FILE),
            logging.StreamHandler(sys.stdout)
        ]
    )

def main():
    """The main function for the key search orchestrator."""
    setup_logging()
    logging.info("--- LAUNCHING KEY SEARCH ---")

    # 1. Read Target Address
    try:
        # The script is in tools/, so the target file is in the parent directory
        target_address_path = os.path.join(os.path.dirname(__file__), '..', TARGET_ADDRESS_FILE)
        with open(target_address_path, 'r') as f:
            target_address = f.read().strip()
        logging.info(f"Target address loaded: {target_address}")
    except FileNotFoundError:
        logging.error(f"FATAL: Target address file not found at '{TARGET_ADDRESS_FILE}'.")
        sys.exit(1)

    # 2. Load Initial State (Counter)
    start_counter = 0
    try:
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE, 'r') as f:
                content = f.read().strip()
                if content:
                    start_counter = int(content)
                    logging.info(f"Resuming search from counter: {start_counter}")
                else:
                    logging.info("State file is empty. Starting search from counter: 0")
        else:
            logging.info(f"No state file found. Starting search from counter: 0")
    except (ValueError, IOError) as e:
        logging.warning(f"Could not read state file '{STATE_FILE}': {e}. Starting from 0.")

    # 3. The Main Attack Loop
    counter = start_counter
    last_log_time = time.time()
    last_log_counter = counter

    logging.info("Starting attack loop...")
    try:
        while True:
            # Generate candidate key and derive address
            private_key = generate_candidate_key(counter)
            derived_address = derive_address(private_key)

            # Check for a match
            if derived_address == target_address:
                logging.info("!!!!!!!!!! KEY FOUND !!!!!!!!!!")
                logging.info(f"WINNING PRIVATE KEY: {private_key}")
                logging.info(f"WINNING COUNTER: {counter}")
                # Write final state before exiting
                with open(STATE_FILE, 'w') as f:
                    f.write(str(counter))
                break  # Exit the loop

            # Save state periodically
            if counter % STATE_SAVE_INTERVAL == 0:
                with open(STATE_FILE, 'w') as f:
                    f.write(str(counter))

            # Log progress periodically
            if counter > 0 and counter % LOG_INTERVAL == 0:
                current_time = time.time()
                elapsed_time = current_time - last_log_time
                keys_checked = counter - last_log_counter
                keys_per_second = keys_checked / elapsed_time if elapsed_time > 0 else 0

                logging.info(f"Counter: {counter} | Keys/sec: {keys_per_second:.2f}")

                last_log_time = current_time
                last_log_counter = counter

            counter += 1

    except KeyboardInterrupt:
        logging.info("\nSearch interrupted by user. Saving final state.")
        with open(STATE_FILE, 'w') as f:
            f.write(str(counter))
        logging.info(f"Search paused at counter: {counter}")
        sys.exit(0)
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}", exc_info=True)
        logging.info(f"Saving state at counter: {counter}")
        with open(STATE_FILE, 'w') as f:
            f.write(str(counter))
        sys.exit(1)

if __name__ == "__main__":
    main()