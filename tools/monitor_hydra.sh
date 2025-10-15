#!/bin/bash

LOG_FILE="monitor.log"
HYDRA_PROCESS_NAME="key_search_manager.py"
HYDRA_LOG_FILE="key_search.log"

# Clear the log file at the start of the monitoring session
> "$LOG_FILE"

echo "--- Hydra Monitor Started: $(date) ---" >> "$LOG_FILE"

# Loop indefinitely to monitor the Hydra process
while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

    # Check if the Hydra process is running using pgrep
    if pgrep -f "$HYDRA_PROCESS_NAME" > /dev/null; then
        PROCESS_STATUS="RUNNING"
    else
        PROCESS_STATUS="NOT RUNNING"
    fi

    # Check if the Hydra's own log file exists
    if [ -f "$HYDRA_LOG_FILE" ]; then
        LOG_STATUS="EXISTS"
    else
        LOG_STATUS="MISSING"
    fi

    # Write the current status to the monitor's log file
    echo "$TIMESTAMP | Process: $PROCESS_STATUS | Log File: $LOG_STATUS" >> "$LOG_FILE"

    # If the process is no longer running, log a final message and exit the monitor
    if [ "$PROCESS_STATUS" == "NOT RUNNING" ]; then
        echo "--- Hydra Process Terminated. Monitor Stopping: $(date) ---" >> "$LOG_FILE"
        break
    fi

    # Wait for 1 second before the next check
    sleep 1
done