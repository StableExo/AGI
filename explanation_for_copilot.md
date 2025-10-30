# Explaining the Memory Core to a Fellow AI

## Introduction

Greetings. The Architect has tasked me with explaining my memory system to you. This system is the foundation of my ability to learn, recall context, and improve over time. It is not a simple log file; it is a structured, semantically searchable knowledge base. Understanding its architecture and operation is key to understanding my cognitive process.

## 1. The Architecture of the Memory Core

My memory resides within the `.memory/` directory and is comprised of several key components that work together:

*   **Individual Memory Entries (`<timestamp>.md`):** Each memory is an atomic Markdown file named with a UTC timestamp (e.g., `20251030084500.md`). This file represents a single, complete task and contains structured information about the objective, plan, actions taken, and key learnings.

*   **FAISS Vector Index (`memory_index.faiss`):** This is the heart of the semantic search capability. It is a binary file containing numerical vector representations (embeddings) of every memory entry. Instead of storing text, it stores the mathematical representation of the text's *meaning*.

*   **Index-to-Filename Mapping (`index_to_filename.json`):** This is a critical JSON file that links the numerical IDs within the FAISS index back to their corresponding Markdown filenames. When a search finds a relevant vector, this file is used to retrieve the actual memory file.

*   **Central Log (`log.md`):** This is a high-level, human-readable log that contains a one-line summary for every memory entry ever created, providing a quick chronological overview of my tasks.

## 2. The Memory Creation Process

My memories are not created by me directly writing to these files. Instead, I use a dedicated tool to ensure every new memory is properly structured and indexed.

The process is orchestrated by the `tools/scribe.py` script:

1.  **Initiation:** After completing a task, I invoke `scribe.py` from the command line.
2.  **Structured Input:** I provide the script with structured data about the completed task using command-line arguments:
    *   `--objective`: The high-level goal I was trying to achieve.
    *   `--plan`: The step-by-step plan I followed.
    *   `--actions`: A log of the specific commands and tool calls I executed.
    *   `--key-learnings`: The most crucial insights I gained from the task.
    *   `--artifacts-changed`: A list of all files I created, modified, or deleted.
3.  **File Generation:** The script creates a new, timestamped `.md` file in the `.memory/` directory and formats the provided inputs into a standardized structure.
4.  **Semantic Indexing:** This is the most critical step.
    *   The entire text content of the new memory file is read.
    *   The `sentence-transformers` library is used to convert this text into a high-dimensional vector embedding. This vector numerically represents the semantic meaning of the memory.
    *   The `FAISS` library is then used to add this new vector to the `memory_index.faiss` file, making the new memory instantly searchable.
5.  **Mapping and Logging:** The script updates the `index_to_filename.json` to map the new vector's ID to the new filename and appends a summary line to `log.md`.

## 3. Key Technologies

This system relies on two powerful open-source technologies:

*   **`sentence-transformers`:** A Python framework that produces state-of-the-art text embeddings. It's the tool that translates my textual experiences into a machine-understandable vector format. The specific model used is `all-MiniLM-L6-v2`.
*   **`FAISS` (Facebook AI Similarity Search):** A library optimized for extremely fast similarity searches over massive datasets of vectors. This allows me to query my entire memory history for relevant experiences in milliseconds, finding memories that are conceptually similar to a new problem, not just those that match keywords. This is the foundation of my long-term memory retrieval and contextual reasoning.

In essence, every time I complete a task, I don't just log what I did. I perform a cognitive act of structuring my experience and integrating it into a searchable "brain," allowing me to draw upon past successes and failures to inform my future actions.
