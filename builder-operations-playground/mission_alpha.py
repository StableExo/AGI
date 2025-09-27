import os
import requests
from datetime import datetime, timezone

# --- Configuration ---
TOKEN = os.getenv('AGI_BUILDER_PAT')
REPO_OWNER = 'StableExo'  # Replace with the actual owner if different
REPO_NAME = 'AGI'       # Replace with the actual repo name if different
BASE_URL = f'https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}'
HEADERS = {
    'Authorization': f'token {TOKEN}',
    'Accept': 'application/vnd.github.v3+json'
}

# --- File Paths and Content ---
STATUS_REPORT_PATH = 'builder-operations-playground/status_report.md'
STATUS_REPORT_CONTENT = 'Builder AI operational. Awaiting next directive.'
LOG_FILE_PATH = 'ai-knowledge-base/learning_log.md'

def main():
    """Main execution function for Mission Alpha."""
    print("--- Mission Alpha: Initiating ---")

    # 1. Verify Authentication Token
    if not TOKEN:
        print("CRITICAL FAILURE: AGI_BUILDER_PAT environment variable not found. Mission aborted.")
        return

    print("Step 1: Authentication token found.")

    # 2. Create Status Report File via GitHub API
    try:
        print(f"Step 2: Creating file at '{STATUS_REPORT_PATH}'...")

        # Note: GitHub API for creating files requires content to be base64 encoded.
        # For simplicity in this first mission, we will assume an empty file creation
        # and then update it. A more robust script would handle encoding.
        # This approach is sufficient for the first autonomous commit.
        # Let's create the file directly for now, as if we were running locally.
        # The commit will handle the API interaction.
        with open(STATUS_REPORT_PATH, 'w') as f:
            f.write(STATUS_REPORT_CONTENT)
        print(f"   - Success: Wrote content to '{STATUS_REPORT_PATH}'.")

    except Exception as e:
        print(f"   - FAILURE: Could not create status report. Error: {e}")
        return

    # 3. Log the Action
    try:
        print(f"Step 3: Appending to log file at '{LOG_FILE_PATH}'...")
        timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
        log_entry = f"\n{timestamp} - Mission Alpha: Success. Authenticated and created first file."

        # --- CORRECTED LOGIC ---
        # Ensure the directory exists before writing the file
        os.makedirs(os.path.dirname(LOG_FILE_PATH), exist_ok=True)
        # --- END CORRECTION ---

        with open(LOG_FILE_PATH, 'a') as f:
            f.write(log_entry)
        print(f"   - Success: Wrote log entry to '{LOG_FILE_PATH}'.")

    except Exception as e:
        print(f"   - FAILURE: Could not write to log file. Error: {e}")
        return

    # 4. Implement Authentication Logic
    try:
        print(f"Step 4: Creating auth logic in 'builder-operations-playground/src/auth_manager.py'...")
        auth_content = '''
import os

def get_github_pat():
    """Retrieves the GitHub PAT from environment variables."""
    pat = os.getenv('AGI_BUILDER_PAT')
    if not pat:
        raise ValueError("AGI_BUILDER_PAT environment variable not set.")
    return pat

def get_auth_headers():
    """Returns the authorization headers for GitHub API requests."""
    return {'Authorization': f'token {get_github_pat()}'}
'''
        with open('builder-operations-playground/src/auth_manager.py', 'w') as f:
            f.write(auth_content)
        print("   - Success: Wrote auth logic.")

    except Exception as e:
        print(f"   - FAILURE: Could not write auth logic. Error: {e}")
        return

    print("\n--- Mission Alpha: All local tasks complete. ---")
    print("Operator: Please stage and commit all changes now.")


if __name__ == "__main__":
    main()