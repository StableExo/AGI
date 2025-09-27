# Refactoring Plan: Centralized Logging

## 1. Problem Analysis
The current scripts (`mission_alpha.py`, `mission_gamma.py`) contain duplicate code for appending timestamped entries to the learning log. This is inefficient and difficult to maintain.

## 2. Proposed Solution
I will create a new Python module at `builder-operations-playground/utils/logger.py`.

This module will contain a single, reusable function named `log_mission_success`.

### Function Signature:
`def log_mission_success(mission_name: str, message: str):`

### Function Behavior:
- It will accept a mission name and a success message as arguments.
- It will generate a standard ISO 8601 timestamp.
- It will format the log entry as: `[Timestamp] - [Mission Name]: Success. [Message].`
- It will handle creating the `ai-knowledge-base` directory if it does not exist.
- It will append the formatted entry to `ai-knowledge-base/learning_log.md`.

## 3. Next Steps
Once this plan is approved, I will implement the new `logger.py` module and refactor all existing and future mission scripts to use this centralized function.