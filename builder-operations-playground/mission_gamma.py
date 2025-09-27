import os
from utils.logger import log_mission_success

def main():
    # Define file paths
    original_report_path = "builder-operations-playground/status_report.md"
    new_report_path = "builder-operations-playground/system_status.md"

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
    log_mission_success("Mission Gamma", "Refactored status report file.")
    print("Logged refactoring to 'ai-knowledge-base/learning_log.md'.")

if __name__ == "__main__":
    main()