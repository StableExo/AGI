# Documentation Discrepancy Report

This report lists all identified discrepancies between the project's documentation and its actual file structure and content.

## 1. `SYSTEM_INTEGRITY_REPORT.md`
*   **Incorrect Finding:** States that `docs/architecture/CODE_REVIEW_GUIDELINES.md` does not exist.
    *   **Reality:** The file exists at the specified location.

## 2. `README.md`
*   **Incomplete Description of "The Immune System":** Describes the "Briefing Assistant" as being located in `.github/workflows/`.
    *   **Reality:** The "Briefing Assistant" is both a root-level project (`briefing_assistant/`) and has a corresponding workflow file (`.github/workflows/briefing_assistant.yml`). The description should be updated to reflect this dual nature.

## 3. `PROJECT_SUMMARY.md`
*   **Missing Project:** The "Briefing Assistant" is not mentioned as an active project.

## 4. `AI_ONBOARDING_GUIDE.md`
*   **Incomplete Description of "The Briefing Assistant":** The guide describes the Briefing Assistant's function but doesn't clarify its location or architecture, which could be confusing for a new agent.
*   **Potentially Outdated Tool Descriptions:** The guide describes `scribe.py` and `memory_indexer.py`. I need to verify that their descriptions are still accurate.