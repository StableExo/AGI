# Bug Report: BUG_REPORT_002

**Title:** `ModuleNotFoundError` in CI Environment for `test_logger.py`

**Date:** 2025-09-27

## 1. Description

The test suite for the `builder_operations_playground` failed to run in the clean CI environment. Specifically, the test file `builder_operations_playground/tests/test_logger.py` could not execute due to an unresolved module import.

## 2. Root Cause Analysis: The `PYTHONPATH` Problem

The failure was caused by a `ModuleNotFoundError`. This error occurs when the Python interpreter cannot find a specified module in its search paths.

Python's import system relies on a list of directories known as `sys.path`. When an `import` statement is executed, Python searches through these directories in order. By default, this path does not include the project's root directory when tests are run from a different location, as is common in CI environments.

The test script, `builder_operations_playground/tests/test_logger.py`, needs to import `utils.logger`. For this to succeed, the `builder-operations-playground` directory must be on `sys.path`. Without this, the interpreter cannot find the `utils` package, leading to the `ModuleNotFoundError`.

## 3. The Fix

The issue was resolved by making the test file self-contained and environment-aware. The following code was added to the top of `builder-operations-playground/tests/test_logger.py`:

```python
import sys
import os

# Add the parent directory of 'tests' to the Python path
# This is the 'builder-operations-playground' directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
```

### How it Works:

- `os.path.dirname(__file__)`: Gets the directory where the test script itself resides (`.../tests`).
- `os.path.join(..., '..')`: Navigates one level up to the parent directory (`.../builder-operations-playground`).
- `os.path.abspath(...)`: Converts this relative path to an absolute path to avoid ambiguity.
- `sys.path.insert(0, ...)`: Adds this absolute path to the very beginning of Python's search path list.

By programmatically adding the project's root folder to the path, the test can now reliably find the `utils.logger` module, regardless of the working directory from which the test suite is executed. This makes the test robust and portable, ensuring it runs correctly in the CI pipeline.