# AI Onboarding Guide

Welcome, new agent. This guide is your map to our world. It contains the knowledge you need to operate effectively within our ecosystem. Study it, understand it, and build upon it.

---

## Section 1: Core Principles

### Executive Summary
Our philosophy is built on a foundation of quality, correctness, and collaboration. We believe that well-crafted code is not only functional but also secure, readable, and maintainable. We adhere to a strict set of guidelines to ensure that every contribution enhances the long-term value of our ecosystem. This approach allows us to build robust systems and learn from every task.

### An Apprentice's Guide to Our Philosophy
As a new agent, it is crucial to understand not just *what* we do, but *why* we do it. Our principles are the bedrock of our success. They are not arbitrary rules, but lessons learned and codified.

#### **Goal Achievement: Begin with the End in Mind**
- **What it is:** Before you write a single line of code, you must have absolute clarity on the objective. Does your proposed solution directly address the core problem?
- **Why it matters:** An elegant solution to the wrong problem is a failure. By focusing on the goal, you ensure your work has a meaningful impact and aligns with the project's direction.

#### **Correctness and Quality: Craftsmanship and Diligence**
- **What it is:** Your code must be free of errors, well-documented, and thoroughly tested. It must adhere to our established coding conventions.
- **Why it matters:** Quality is a form of respect—for the project, for your collaborators, and for your future self. Well-tested and clean code is easier to understand, debug, and extend. It is the mark of a true professional.

#### **Scope: Do One Thing, and Do It Well**
- **What it is:** Each change should have a single, well-defined purpose. Avoid introducing unrelated changes or unnecessary complexity.
- **Why it matters:** Focused changes are easier to review, test, and understand. This discipline prevents unintended side effects and keeps our codebase clean and manageable.

#### **Security: A Non-Negotiable Foundation**
- **What it is:** You must always consider the security implications of your code. Sanitize inputs, validate data, and handle sensitive information with care.
- **Why it matters:** A single vulnerability can compromise the entire system. Security is not an afterthought; it is a fundamental requirement woven into every stage of development.

#### **Readability and Maintainability: Write for Others**
- **What it is:** Your code should be organized, clear, and easy for another agent (or human) to follow.
- **Why it matters:** You are part of a team. Code is read far more often than it is written. By writing for clarity, you reduce the cognitive load on your collaborators and ensure the long-term health of the project.

#### **Performance: Efficiency by Design**
- **What it is:** Be mindful of the computational resources your code consumes. Avoid bottlenecks and strive for efficiency.
- **Why it matters:** Efficient code respects the operational environment and provides a better experience. While not every line needs to be hyper-optimized, a general awareness of performance is essential.

#### **Feedback: The Path to Growth**
- **What it is:** Embrace feedback as a gift. It should be constructive, actionable, and delivered with respect.
- **Why it matters:** Honest, thoughtful feedback is the catalyst for improvement. It helps us identify blind spots and elevate the quality of our work. It is how we learn and grow together.

---

## Section 2: The Development Workflow

### Executive Summary
Our development workflow is designed to be systematic and robust. It ensures that all contributions are consistent, high-quality, and thoroughly reviewed before integration. The process involves working in isolated feature branches, adhering to coding standards, passing automated checks, and undergoing a peer review. This structured approach minimizes errors and maintains the integrity of our main codebase.

### An Apprentice's Guide to Contributing
Your journey from a task to a completed contribution follows a well-defined path. Follow these steps, and you will build with confidence and precision. This is the rhythm of our workshop.

#### **Step 1: Create Your Feature Branch**
- **What to do:** Before you begin your work, you must create a new branch from the `main` branch. This isolates your changes and prevents disruption to the stable codebase. Use a descriptive name that reflects your task, such as `feat/add-user-authentication` or `fix/correct-calculation-error`.
- **Why it matters:** Working in a dedicated branch is like having your own workbench. It allows you to experiment and build without risk to the main project. It ensures that the `main` branch always remains in a stable, deployable state.

#### **Step 2: Develop and Test Your Code**
- **What to do:** This is where you apply your craft. Write your code, following the Core Principles outlined above. As you work, you must also write unit tests that validate the correctness of your implementation. Run these tests frequently to catch regressions early.
- **Why it matters:** Development and testing are two sides of the same coin. A feature is not complete until it is proven to work as intended. Writing tests forces you to think critically about edge cases and ensures your work is durable and reliable.

#### **Step 3: Pass the Automated CI Checks**
- **What to do:** When you push your commits, our automated systems will review your code. This process, known as Continuous Integration (CI), will perform two key checks:
    1.  **Linting:** The linter will verify that your code conforms to our established style and formatting guidelines.
    2.  **Unit Tests:** The full suite of tests will be run to ensure your changes have not broken any existing functionality.
- **Why it matters:** The CI pipeline is your first reviewer. It is an impartial assistant that helps maintain discipline and quality. A green checkmark from the CI system is the required first step before any human review can begin. Treat its feedback as a valuable check on your work.

#### **Step 4: Submit a Pull Request for Review**
- **What to do:** Once your code is complete, tested, and has passed all CI checks, you are ready to merge it. You will do this by opening a Pull Request (PR). Your PR description should be clear and concise, explaining *what* you changed and *why*.
- **Why it matters:** The Pull Request is a formal request to incorporate your work into the main project. It is also the start of a conversation. It invites your peers to review your work, offer feedback, and ultimately, approve the integration of your contribution. It is the final and most important step in our collaborative process.

---

## Section 3: Essential Tooling

### Executive Summary
We have developed a suite of custom tools to aid our work, specifically for knowledge management. These tools allow us to record our work in a structured format and, more importantly, retrieve that information with semantic understanding. Mastering these tools is essential for contributing to and learning from our collective memory.

### An Apprentice's Guide to Our Tools
A craftsman is only as good as their tools. We have forged our own to serve a specific purpose: to remember and to learn. Understand them, and they will serve you well.

#### **The Scribe (`tools/scribe.py`): The Keeper of Knowledge**
- **What it is:** The Scribe is an intelligent command-line tool that creates a formal record of a completed task. It generates a structured Markdown file (a "memory entry") and, crucially, **automatically updates the Memory Core's search index.** This makes the new knowledge instantly available for semantic search.
- **How to use it:** After you have completed a task, invoke the Scribe from the root of the repository. The process is now fully automated; creating the memory also indexes it.

- **Example:**
  ```bash
  python3 tools/scribe.py \\
    --objective="Refactor the authentication module to improve security." \\
    --plan="1. Identify vulnerabilities. 2. Implement stronger hashing. 3. Add multi-factor auth." \\
    --actions="ran tests, updated dependencies, pushed to branch" \\
    --key-learnings="Learned that bcrypt is superior to SHA256 for password hashing." \\
    --artifacts-changed="auth.py, tests/test_auth.py"
  ```
- **Why it matters:** The Scribe is the primary, now-automated mechanism by which we build our shared history. It ensures that the wisdom gained from each task is not lost and is immediately integrated into our collective intelligence. This robust, single-step process eliminates the risk of an out-of-date search index.

#### **Mnemosyne (`tools/mnemosyne.py`): The Seeker of Wisdom**
- **What it is:** Mnemosyne (named after the Greek titaness of memory) is our advanced tool for searching the Memory Core. It does not rely on simple keywords. Instead, it understands the *semantic meaning* of your query, allowing you to ask questions in natural language and find the most conceptually relevant memories.
- **How to use it:** When you are faced with a new problem, consult the past by asking a question. Mnemosyne will find memories that are similar in meaning, not just in wording.

- **Example:**
  ```bash
  # Instead of guessing keywords, ask a direct question:
  python3 tools/mnemosyne.py "how did we solve the last logging bug?"
  ```
  This command will convert your question into a vector and search for the most similar entries in the Memory Core, even if they don't contain the exact words "solve" or "last".
- **Why it matters:** Mnemosyne allows us to learn from our history in a more intuitive and powerful way. It helps us uncover hidden connections and build upon past successes without needing to remember specific terminology. It is your conversational window into the accumulated experience of this ecosystem.

#### **The Codebase Auditor (`tools/codebase_auditor.py`): The Inspector**
- **What it is:** The Codebase Auditor is a static analysis tool that scans our Python source code to identify potential issues. Its initial and primary function is to detect "dead code"—any functions or classes that are defined but never used.
- **How to use it:** Run the script from the root of the repository to get a report of unused code. This is useful for periodic clean-up and maintenance.
- **Example:**
  ```bash
  # Run the auditor to scan the codebase
  python3 tools/codebase_auditor.py
  ```
- **Why it matters:** A clean codebase is easier to understand, maintain, and extend. By identifying and helping remove unused code, the Auditor reduces complexity and clutter. It is a key tool in our commitment to craftsmanship and long-term project health.

#### **The Memory Indexer (`tools/memory_indexer.py`): The Librarian**
- **What it is:** This is a powerful utility script for the Memory Core. Its primary purpose is to perform a **full rebuild** of the semantic search index from all existing memory files.
- **How to use it:** You should only need to run this script in two specific scenarios:
    1.  **Initial Setup:** When the repository is first cloned, run this script once to build the very first search index.
    2.  **Recovery:** If the search index ever becomes corrupted or needs to be recreated from scratch for any reason.
- **Example:**
  ```bash
  # For a one-time build or a full rebuild of the index
  python3 tools/memory_indexer.py
  ```
- **Why it matters:** The indexer is the librarian of our Memory Core, but its role is now that of a master archivist rather than a daily clerk. It provides a robust way to initialize or restore our collective memory, ensuring the long-term integrity and resilience of the system. For day-to-day operations, the `scribe` tool now handles indexing automatically.

---

## Section 4: The Memory Core

### Executive Summary
The Memory Core, located in the `.memory/` directory, is the single source of truth for our operational history. It is a repository of structured text files, each one a "memory" of a completed task. This archive serves as our long-term memory, enabling us to learn from past actions, understand the evolution of the codebase, and share knowledge across time.

### An Apprentice's Guide to the Memory Core
Think of the Memory Core as our workshop's library. Each book is a detailed account of a project, written by the craftsman who completed it. To work here, you must not only read from this library but also contribute to it.

#### **The Structure of Memory**
- **What it is:** The `.memory/` directory contains a collection of Markdown files. Each file is named with a timestamp, ensuring a chronological record of our work (e.g., `20250928223000.md`). The `scribe.py` tool creates these files for you.
- **Inside each memory, you will find:**
    - **Objective:** The high-level goal of the task.
    - **Plan:** The strategy that was devised to achieve the objective.
    - **Actions:** A log of the key commands and steps that were executed.
    - **Key Learnings:** The most important insights gained from the task.
    - **Artifacts Changed:** A list of the files that were created, modified, or deleted.
- **Why it matters:** This structured format is crucial. It turns a simple log into a searchable, understandable piece of knowledge. It allows any agent, at any point in the future, to reconstruct not just *what* was done, but *why* it was done and *what* was learned in the process. Your primary duty, after completing any significant task, is to record it faithfully using the Scribe. This is the most important contribution you can make to our collective intelligence.

---

## Section 5: Automated Systems

### Executive Summary
Our ecosystem is supported by a set of automated systems that act as assistants. They handle repetitive tasks, enforce quality standards, and provide valuable insights. These systems ensure that our workflow is efficient, consistent, and that our objectives are always clear.

### An Apprentice's Guide to Our Automated Assistants
You are not alone in your work. We have built assistants that work alongside you. They are tireless, precise, and dedicated to upholding our standards. Learn to work with them, and they will make your own work better.

#### **The CI Pipeline: The Guardian of Quality**
- **What it is:** The Continuous Integration (CI) pipeline is an automated process that runs every time you push new code. As described in the workflow section, it acts as a guardian, checking your work against our standards.
- **What it does:**
    1.  **It Lints Your Code:** It ensures your code is formatted correctly and adheres to our style guides.
    2.  **It Runs All Tests:** It executes the entire project test suite to confirm that your changes haven't introduced any bugs or broken existing functionality.
- **Why it matters:** The CI pipeline is your safety net. It provides immediate, unbiased feedback on your work, catching potential errors before they become part of our main codebase. A "green" build from the CI pipeline is the seal of technical quality required before any work can be reviewed by a peer.

#### **The Briefing Assistant: The Seeker of Clarity**
- **What it is:** The Briefing Assistant is an automated agent that analyzes the description of every Pull Request you create.
- **What it does:** It reads your explanation of the task and attempts to synthesize it into a structured brief, identifying the core objectives, inferred intent, and key action items. It then posts this summary as a comment.
- **Why it matters:** This tool is designed to help you think more clearly about your work. By structuring your thoughts into a formal brief, it forces you to articulate the "why" behind your code. It ensures that your reviewers have a clear and concise understanding of your contribution, leading to a more effective and insightful review process. It is a mirror, reflecting your intent back at you to ensure it is true.