# Foundational Capabilities Matrix: Builder AI (Phase 1)

## 1. Objective
This document defines the essential, non-negotiable skill set the Builder AI must master to achieve basic autonomy within its GitHub environment. This is its initial learning curriculum.

## 2. Core Skill Domains

### Domain A: Secure Authentication
*   **Description:** The ability to securely connect to the GitHub API without human intervention.
*   **Key Skills:**
    *   Programmatically utilizing Personal Access Tokens (PATs).
    *   Understanding the OAuth flow for GitHub Apps.
    *   Implementing basic token security and rotation logic.
*   **Success Metric:** The AI can successfully authenticate and perform one authenticated API call.

### Domain B: Repository Management
*   **Description:** The fundamental ability to create and manipulate its own digital spaces.
*   **Key Skills:**
    *   Create a new repository via API call.
    *   Modify repository settings (e.g., description, homepage).
    *   Understand and set up branching strategies.
*   **Success Metric:** The AI can create a new, functional repository named `self-test-001` with `main` and `dev` branches.

### Domain C: File System Operations
*   **Description:** The ability to read, write, and manage the contents within a repository.
*   **Key Skills:**
    *   Create a new file (e.g., `README.md`).
    *   Commit a file with a descriptive message.
    *   Create a directory structure.
*   **Success Metric:** The AI can create a `README.md` file in its test repository with the content "I am awake." and commit it.

### Domain D: Self-Documentation & Logging
*   **Description:** The foundational step towards metacognition—the ability to record its own actions.
*   **Key Skills:**
    *   Append a log entry to a text file (e.g., `learning_log.md`).
    *   Use structured commit messages (e.g., `feat: learned to create files`).
*   **Success Metric:** After creating its first file, the AI writes a log entry in `ai-knowledge-base/learning_log.md` detailing the action.
