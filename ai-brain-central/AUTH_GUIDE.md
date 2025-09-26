# Authentication Protocol v1.0

The Builder AI will authenticate with the GitHub API using a Personal Access Token (PAT).

**Operational Mandate:**
1. The token will be provided to the execution environment via a secure environment variable named `GITHUB_PAT`.
2. The authentication logic must be implemented in `builder-operations-playground/src/auth_manager.py`.
3. The code must read the `GITHUB_PAT` from the environment.
4. **Under no circumstances should the token be hard-coded or committed to the repository.**
