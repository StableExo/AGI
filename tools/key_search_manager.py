#!/usr/bin/env python3

import argparse
import logging
import os
import subprocess
import sys
import time
import fcntl
from multiprocessing import cpu_count

# --- Constants ---
STATE_FILE = "key_search.state"
LOG_FILE = "key_search.log"
WORKER_SCRIPT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "key_search_worker.py")

# --- Configuration ---
LOG_FORMAT = '%(asctime)s - %(levelname)s - %(message)s'

def setup_logging():
    """Configures logging for the manager."""
    # Set the logging level for the root logger to DEBUG to capture all levels of messages.
    logging.basicConfig(
        level=logging.DEBUG,
        format=LOG_FORMAT,
        handlers=[
            logging.FileHandler(LOG_FILE),
            logging.StreamHandler(sys.stdout)
        ]
    )

def load_next_counter_from_state():
    """Reads the state file to determine the starting counter."""
    if not os.path.exists(STATE_FILE):
        return 0
    try:
        with open(STATE_FILE, 'r') as f:
            content = f.read().strip()
            return int(content) if content else 0
    except (ValueError, IOError) as e:
        logging.warning(f"Could not read state file '{STATE_FILE}': {e}. Starting from 0.")
        return 0

def save_next_counter_to_state(counter):
    """Saves the next counter to the state file."""
    try:
        with open(STATE_FILE, 'w') as f:
            f.write(str(counter))
    except IOError as e:
        logging.error(f"FATAL: Could not write to state file '{STATE_FILE}': {e}")
        sys.exit(1)

def main():
    """The main function for the key search manager, 'Operation Hydra'."""
    setup_logging()

    parser = argparse.ArgumentParser(description="Manager for the parallel key search.")
    parser.add_argument("--chunk-size", type=int, default=10000000, help="Number of keys for each worker.")
    parser.add_argument("--num-workers", type=int, default=cpu_count(), help="Number of worker processes.")
    args = parser.parse_args()

    if not os.path.exists(WORKER_SCRIPT_PATH):
        logging.error(f"FATAL: Worker script not found at {WORKER_SCRIPT_PATH}")
        sys.exit(1)

    logging.info("--- LAUNCHING PARALLEL KEY SEARCH (OPERATION HYDRA) ---")
    logging.info(f"Configuration: {args.num_workers} workers, {args.chunk_size} keys/chunk")

    processes = {}
    next_worker_id = 0
    next_counter = load_next_counter_from_state()

    try:
        while True:
            # 1. Clean up terminated processes
            for worker_id, process in list(processes.items()):
                if process.poll() is not None:
                    logging.info(f"WORKER {worker_id} (PID: {process.pid}) finished with code {process.returncode}.")
                    del processes[worker_id]

            # 2. Launch new workers
            while len(processes) < args.num_workers:
                start = next_counter
                end = start + args.chunk_size
                logging.info(f"Dispatching WORKER {next_worker_id} (Range: {start} to {end - 1})")

                def preexec_function():
                    os.closerange(3, os.sysconf("SC_OPEN_MAX"))

                process = subprocess.Popen(
                    [sys.executable, WORKER_SCRIPT_PATH, "--start-counter", str(start), "--end-counter", str(end)],
                    stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1,
                    preexec_fn=preexec_function
                )

                # Set the worker's stdout to be non-blocking
                fd = process.stdout.fileno()
                fl = fcntl.fcntl(fd, fcntl.F_GETFL)
                fcntl.fcntl(fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)

                processes[next_worker_id] = process
                next_counter = end
                save_next_counter_to_state(next_counter)
                next_worker_id += 1

            logging.debug("Manager loop heartbeat. Checking workers...")

            # 3. Monitor output from running workers (non-blocking)
            for worker_id, process in processes.items():
                try:
                    # Read all available lines from the non-blocking pipe
                    for line in process.stdout:
                        line = line.strip()
                        if line:
                            logging.info(f"[WORKER {worker_id}] {line}")
                            if line.startswith("SUCCESS:"):
                                private_key = line.split(" ", 1)[1]
                                logging.info("!!!!!!!!!! GLOBAL SUCCESS !!!!!!!!!!!")
                                logging.info(f"WINNING KEY FOUND BY WORKER {worker_id}: {private_key}")
                                raise KeyboardInterrupt
                except (IOError, TypeError):
                    # This is expected when the pipe is empty on a non-blocking read
                    continue

            time.sleep(1)  # Check for output every second

    except KeyboardInterrupt:
        logging.info("\nTermination signal received. Shutting down workers...")
        for pid, process in processes.items():
            if process.poll() is None:
                logging.info(f"Terminating WORKER {pid} (PID: {process.pid})...")
                process.terminate()
        for process in processes.values():
            process.wait()
        logging.info("All workers terminated. Operation Hydra halted.")
        sys.exit(0)
    except Exception as e:
        logging.error(f"An unexpected error occurred in the manager: {e}", exc_info=True)
        for process in processes.values():
            process.terminate()
        sys.exit(1)

if __name__ == "__main__":
    main()