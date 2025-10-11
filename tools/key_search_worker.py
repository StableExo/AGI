#!/usr/bin/env python3

import argparse
import os
import sys
import time

from candidate_key_generator import generate_candidate_key
from address_deriver import derive_address

# --- Constants ---
TARGET_ADDRESS_FILE = "TARGET_ADDRESS.txt"
LOG_INTERVAL = 100000     # Log progress every 100,000 keys

def main():
    """The main function for the key search worker."""
    parser = argparse.ArgumentParser(description="Worker process for the parallel key search.")
    parser.add_argument("--start-counter", type=int, required=True, help="The starting counter for the search range.")
    parser.add_argument("--end-counter", type=int, required=True, help="The ending counter for the search range.")
    args = parser.parse_args()

    # 1. Read Target Address
    try:
        target_address_path = os.path.join(os.path.dirname(__file__), '..', TARGET_ADDRESS_FILE)
        with open(target_address_path, 'r') as f:
            target_address = f.read().strip()
    except FileNotFoundError:
        # Use print to stderr for errors, so manager can distinguish
        print(f"FATAL: Target address file not found at '{TARGET_ADDRESS_FILE}'.", file=sys.stderr)
        sys.exit(1)

    # 2. The Main Search Loop
    last_log_time = time.time()
    last_log_counter = args.start_counter

    print(f"Starting search from {args.start_counter} to {args.end_counter}...")

    try:
        for counter in range(args.start_counter, args.end_counter):
            private_key = generate_candidate_key(counter)
            derived_address = derive_address(private_key)

            if derived_address == target_address:
                # SUCCESS SIGNAL for the manager
                print(f"SUCCESS: {private_key}")
                sys.exit(0) # Exit cleanly

            # Log progress periodically to stdout
            if counter > 0 and (counter - args.start_counter) % LOG_INTERVAL == 0:
                current_time = time.time()
                elapsed_time = current_time - last_log_time
                keys_checked = counter - last_log_counter
                keys_per_second = keys_checked / elapsed_time if elapsed_time > 0 else 0

                print(f"Counter: {counter} | Keys/sec: {keys_per_second:.2f}")

                last_log_time = current_time
                last_log_counter = counter

    except Exception as e:
        print(f"An unexpected error occurred in worker: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"Finished search from {args.start_counter} to {args.end_counter}. Key not found in this range.")


if __name__ == "__main__":
    main()