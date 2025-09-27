import os
import datetime

def main():
    # Define file paths
    original_report_path = "builder-operations-playground/status_report.md"
    new_report_path = "builder-operations-playground/system_status.md"
    log_file_path = "ai-knowledge-base/learning_log.md"

    # 1. Rename the status report file
    if os.path.exists(original_report_path):
        os.rename(original_report_path, new_report_path)
        print(f"Renamed '{original_report_path}' to '{new_report_path}'.")
    else:
        print(f"Error: '{original_report_path}' not found.")
        return

    # 2. Update the content of the new file
    new_content = """\
System Status: NOMINAL
Last Mission: Mission Bravo (Success)
Current Directive: Awaiting next."""
    with open(new_report_path, "w") as f:
        f.write(new_content)
    print(f"Updated content of '{new_report_path}'.")

    # 3. Log the refactoring
    timestamp = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat()
    log_entry = f"\n{timestamp} - Mission Gamma: Success. Refactored status report file.".replace("+00:00", "Z")
    with open(log_file_path, "a") as f:
        f.write(log_entry)
    print(f"Logged refactoring to '{log_file_path}'.")

if __name__ == "__main__":
    main()