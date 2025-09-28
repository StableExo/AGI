# Memory Core Schema

This document defines the structure for a single memory entry in the Memory Core. Each memory is a Markdown file stored in the `.memory/` directory.

## Fields

- **task_id**: A unique identifier for the task. This is typically the timestamp of the memory file's creation.
- **objective**: A concise, high-level statement of the goal.
- **plan**: The step-by-step plan that was formulated to achieve the objective.
- **actions**: A chronological log of the commands and tools used during the task. This should include both successful and failed actions to provide a complete picture of the process.
- **key_learnings**: A synthesis of the most important takeaways from the task. This can include:
    - New techniques or patterns that were successful.
    - Mistakes made and how they were corrected.
    - Unexpected outcomes or discoveries.
    - Reflections on how to approach similar tasks in the future.
- **artifacts_changed**: A list of all files that were created, modified, or deleted during the task. This provides a clear record of the impact on the codebase.