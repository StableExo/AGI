#!/usr/bin/env python3
import sys
import subprocess

def find_mission_commit(mission_codename):
    """
    Finds the commit hash for a given mission codename by searching git logs.
    """
    search_string = f"Mission {mission_codename}: Success."
    try:
        # Command to find the commit hash
        command = [
            "git", "log", f"--grep={search_string}",
            "--pretty=format:%H", "-n", "1"
        ]
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=True
        )
        commit_hash = result.stdout.strip()
        if not commit_hash:
            return None
        return commit_hash
    except subprocess.CalledProcessError:
        # This can happen if git log fails for some reason
        return None
    except FileNotFoundError:
        print("Error: 'git' command not found. Is Git installed and in your PATH?")
        sys.exit(1)

def get_commit_details(commit_hash):
    """
    Retrieves and prints the details of a specific commit.
    """
    try:
        # Command to get commit details and changed files
        command = [
            "git", "show", commit_hash,
            "--pretty=format:Full commit hash: %H%nAuthor: %an%nDate: %ad",
            "--name-only"
        ]
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=True
        )

        # The output contains details and a list of files, separated by a blank line
        parts = result.stdout.strip().split('\n\n', 1)
        details = parts[0]
        files_changed = parts[1] if len(parts) > 1 else "No files listed in commit."

        print("--- Mission Commit Summary ---")
        print(details)
        print("Files changed:")
        # Indent file names for readability
        for f in files_changed.strip().split('\n'):
            print(f"  - {f}")
        print("------------------------------")

    except subprocess.CalledProcessError as e:
        print(f"Error: Could not retrieve details for commit {commit_hash}.")
        print(e.stderr)
        sys.exit(1)

def main():
    """
    Main function to drive the script.
    """
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <mission_codename>")
        print("Example: ./historian.py \"Mission Chi\"")
        sys.exit(1)

    mission_codename = sys.argv[1]

    commit_hash = find_mission_commit(mission_codename)

    if not commit_hash:
        print(f"Error: No commit found for '{mission_codename}'.")
        sys.exit(1)

    get_commit_details(commit_hash)

if __name__ == "__main__":
    main()