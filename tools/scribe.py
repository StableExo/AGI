#!/usr/bin/env python3
import argparse
import datetime
import os
import sys

def create_memory_entry(objective, plan, actions, key_learnings, artifacts_changed):
    """
    Creates a new structured memory entry in the .memory directory.
    """
    # 1. Generate a timestamp-based task_id
    now = datetime.datetime.now(datetime.timezone.utc)
    task_id = now.strftime("%Y%m%d%H%M%S")
    filename = f"{task_id}.md"
    filepath = os.path.join(".memory", filename)

    # 2. Construct the memory content in Markdown format
    content = f"""\
# Memory Entry: {task_id}

## Objective
{objective}

## Plan
{plan}

## Actions
```
{actions}
```

## Key Learnings
{key_learnings}

## Artifacts Changed
```
{artifacts_changed}
```
"""

    # 3. Write the new memory file
    try:
        with open(filepath, "w") as f:
            f.write(content)
        print(f"Successfully created memory entry: {filepath}")
    except IOError as e:
        print(f"Error: Could not write to file {filepath}", file=sys.stderr)
        print(e, file=sys.stderr)
        sys.exit(1)

    # 4. Append a summary to the main log file
    log_filepath = os.path.join(".memory", "log.md")
    summary_line = f"{now.isoformat()} - Objective: {objective}\n"
    try:
        with open(log_filepath, "a") as f:
            f.write(summary_line)
        print(f"Successfully updated log: {log_filepath}")
    except IOError as e:
        print(f"Error: Could not append to log file {log_filepath}", file=sys.stderr)
        print(e, file=sys.stderr)
        # Don't exit, creating the entry is the primary success

def main():
    """
    Main function to parse arguments and drive the script.
    """
    parser = argparse.ArgumentParser(
        description="Create a new structured memory entry for the Memory Core."
    )
    parser.add_argument("--objective", required=True, help="The high-level goal of the task.")
    parser.add_argument("--plan", required=True, help="The step-by-step plan.")
    parser.add_argument("--actions", required=True, help="A log of commands and actions taken.")
    parser.add_argument("--key-learnings", required=True, help="Key insights and takeaways.")
    parser.add_argument("--artifacts-changed", required=True, help="A list of files created, modified, or deleted.")

    args = parser.parse_args()

    create_memory_entry(
        objective=args.objective,
        plan=args.plan,
        actions=args.actions,
        key_learnings=args.key_learnings,
        artifacts_changed=args.artifacts_changed,
    )

if __name__ == "__main__":
    main()