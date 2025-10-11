#!/usr/bin/env python3

import argparse
import logging
import os
import subprocess
import sys
import time
from multiprocessing import cpu_count

# --- Constants ---
STATE_FILE = "key_search.state"
LOG_FILE = "key_search.log"
# Construct an absolute path to the worker script
WORKER_SCRIPT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "key_search_worker.py")

# --- Configuration ---
LOG_FORMAT = '%(asctime)s - %(message)s'

def setup_logging():
    """Configures logging for the manager to file and console."""
    logging.basicConfig(
        level=logging.INFO,
        format=LOG_FORMAT,
        handlers=[
            logging.FileHandler(LOG_FILE),
            logging.StreamHandler(sys.stdout)
        ]
    )

def load_next_counter_from_state():
    """Reads the state file to determine the starting counter for the next chunk."""
    if not os.path.exists(STATE_FILE):
        return 0
    try:
        with open(STATE_FILE, 'r') as f:
            content = f.read().strip()
            return int(content) if content else 0
    except (ValueError, IOError) as e:
        logging.warning(f"Could not read or parse state file '{STATE_FILE}': {e}. Starting from 0.")
        return 0

def save_next_counter_to_state(counter):
    """Saves the next counter to be assigned to the state file."""
    try:
        with open(STATE_FILE, 'w') as f:
            f.write(str(counter))
    except IOError as e:
        logging.error(f"FATAL: Could not write to state file '{STATE_FILE}': {e}")
        # This is a critical error, as we can no longer guarantee progress.
        sys.exit(1)

def main():
    """The main function for the key search manager, 'Operation Hydra'."""
    setup_logging()

    parser = argparse.ArgumentParser(description="Manager for the parallel key search.")
    parser.add_argument("--chunk-size", type=int, default=10000000, help="The number of keys for each worker to search.")
    parser.add_argument("--num-workers", type=int, default=cpu_count(), help="The number of worker processes to launch.")
    args = parser.parse_args()

    if not os.path.exists(WORKER_SCRIPT_PATH):
        logging.error(f"FATAL: Worker script not found at {WORKER_SCRIPT_PATH}")
        sys.exit(1)

    logging.info("--- LAUNCHING PARALLEL KEY SEARCH (OPERATION HYDRA) ---")
    logging.info(f"Configuration: {args.num_workers} workers, {args.chunk_size} keys/chunk")

    processes = {}  # {worker_id: subprocess.Popen object}
    next_worker_id = 0
    next_counter = load_next_counter_from_state()

    try:
        while True:  # Main dispatch and monitoring loop
            # 1. Clean up terminated processes
            for worker_id, process in list(processes.items()):
                if process.poll() is not None:  # Process has finished
                    logging.info(f"WORKER {worker_id} (PID: {process.pid}) finished with exit code {process.returncode}.")
                    # Log any remaining output
                    for line in process.stdout:
                        logging.info(f"[WORKER {worker_id}] {line.strip()}")
                    for line in process.stderr:
                        logging.error(f"[WORKER {worker_id}] {line.strip()}")
                    del processes[worker_id]

            # 2. Launch new workers in available slots
            while len(processes) < args.num_workers:
                start = next_counter
                end = start + args.chunk_size

                logging.info(f"Dispatching WORKER {next_worker_id} (Range: {start} to {end - 1})")

                process = subprocess.Popen(
                    [sys.executable, WORKER_SCRIPT_PATH, "--start-counter", str(start), "--end-counter", str(end)],
                    stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1
                )
                processes[next_worker_id] = process

                # 3. Atomically update state for the *next* chunk
                next_counter = end
                save_next_counter_to_state(next_counter)

                next_worker_id += 1

            # 4. Monitor output from running workers
            for worker_id, process in processes.items():
                try:
                    # Non-blocking read of stdout
                    line = process.stdout.readline()
                    if line:
                        line = line.strip()
                        logging.info(f"[WORKER {worker_id}] {line}")
                        if line.startswith("SUCCESS:"):
                            private_key = line.split(" ", 1)[1]
                            logging.info("!!!!!!!!!! GLOBAL SUCCESS !!!!!!!!!!!")
                            logging.info(f"WINNING KEY FOUND BY WORKER {worker_id}: {private_key}")
                            # Use KeyboardInterrupt to trigger the shutdown sequence
                            raise KeyboardInterrupt
                except (IOError, ValueError):
                    # Pipe might be closed, poll() check will handle cleanup
                    continue

            time.sleep(0.05)  # Small sleep to prevent a tight loop from consuming 100% CPU

    except KeyboardInterrupt:
        logging.info("\nTermination signal received. Shutting down all workers...")
        for worker_id, process in processes.items():
            if process.poll() is None: # Check if process is still running
                logging.info(f"Terminating WORKER {worker_id} (PID: {process.pid})...")
                process.terminate()
        # Wait for all processes to terminate
        for process in processes.values():
            process.wait()
        logging.info("All workers terminated. Operation Hydra halted.")
        sys.exit(0)
    except Exception as e:
        logging.error(f"An unexpected error occurred in the manager: {e}", exc_info=True)
        # Attempt a graceful shutdown
        for process in processes.values():
            process.terminate()
        sys.exit(1)

if __name__ == "__main__":
    main()