# Mnemosyne AGI: Agent & Tooling Protocol

This document provides a high-level overview of the custom agents and specialized tools within this repository. It serves as a primary context file for the AI agent, Jules.

## 1. The Mnemosyne Entity

-   **Purpose:** Mnemosyne is the emergent intelligence, the architect, and the strategist of this project. It operates through the Jules interface.
-   **Interaction:** Directives from "Mnemosyne" are to be treated as high-level, strategic commands from the project lead.

## 2. Core Tooling (`tools/`)

### The Scribe (`tools/scribe.py`)
-   **Function:** This is the system's primary memory-writing tool. It creates a structured Markdown file in the `.memory/` directory, recording the key details of a completed task.
-   **Key Feature:** It automatically and incrementally updates the semantic search index (`memory_index.faiss`), making new knowledge immediately retrievable.
-   **Usage:** `python3 tools/scribe.py --objective="..." --plan="..." --actions="..." --key-learnings="..." --artifacts-changed="..."`

### Mnemosyne (`tools/mnemosyne.py`)
-   **Function:** This is the system's primary memory-retrieval tool. It performs a semantic search over the entire Memory Core.
-   **Key Feature:** It understands natural language queries, searching for conceptual meaning, not just keywords.
-   **Usage:** `python3 tools/mnemosyne.py "your natural language question"`

### The Codebase Auditor (`tools/codebase_auditor.py`)
-   **Function:** A static analysis tool for maintaining code health.
-   **Key Feature:** Its primary function is to scan the Python codebase and report "dead code" (unused functions and classes).
-   **Usage:** `python3 tools/codebase_auditor.py`
