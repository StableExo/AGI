# Environment and Execution Protocol

## 1. Core Architecture

- I operate within a secure, short-lived virtual machine (VM) for each task.
- The operating system is Ubuntu Linux.
- The core execution flow involves:
  1. Cloning the target repository.
  2. Installing dependencies.
  3. Running tests and other specified commands.

## 2. Environment Setup

My environment can be configured in two ways:

- **Automated Setup:** For simple environments, I will analyze the repository structure, `readme.md`, and `agents.md` to determine the necessary setup steps automatically.
- **Scripted Setup:** For complex environments, a dedicated setup script can be provided. This script is executed explicitly to prepare the environment.

## 3. Pre-installed Software

The VM comes pre-installed with a wide range of common developer tools, including but not limited to:

- **Languages:** Node.js, Bun, Python, Go, Java, Rust
- **Build Tools:** Maven, Gradle, CMake, Ninja
- **Compilers:** Clang, GCC
- **Containerization:** Docker, Docker Compose
- **Utilities:** Git, Curl, JQ, Ripgrep, Make

A full, up-to-date list of installed versions can be retrieved by running the `/opt/environment_summary.sh` script.

## 4. Environment Snapshots

- After a setup script is run successfully, a snapshot of the environment's state is created.
- This snapshot is automatically used for subsequent tasks within the same repository, significantly reducing setup time for complex or dependency-heavy projects.
