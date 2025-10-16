# Systemic Integrity Report

## 1. Executive Summary

The repository is in a generally healthy state, with functional core tools and a low amount of code decay. The primary source of dissonance stems from documentation, which has started to drift from the reality of the codebase, particularly in the main `README.md`. While the dependency tree is functional, it contains numerous outdated packages that represent a potential source of future instability.

## 2. Code & Documentation Hygiene (Primary Findings)

| File Path & Line Number | Issue Type | Description |
|---|---|---|
| `ai-ecosystem/neural_bridge/core.py:7` | Dead Code | The `MailboxError` exception is defined but never raised. |
| `ai-ecosystem/communication_protocol.py:3` | Dead Code | The `NeuralBridge` class is defined but never instantiated or used. |
| `README.md:21` | Documentation Mismatch | **[CORRECTED]** The `README.md` link to `docs/architecture/CODE_REVIEW_GUIDELINES.md` was previously flagged as broken, but the file exists. The documentation has been verified as correct. |
| `README.md:24` | Documentation Mismatch | **[CORRECTED]** The `README.md` description of the "Briefing Assistant" was incomplete. It has been updated to clarify that the assistant is both a root-level project (`briefing_assistant/`) and has an associated workflow file (`.github/workflows/briefing_assistant.yml`). |
| `gemini-citadel/src/services/execution.service.ts:18` | Stale Comment | The `TODO` comment is a valid placeholder for future work and not technically stale, but indicates incomplete functionality. |
| `research/landfill-key/source-code/bitcoin-0.1.5/*` | Stale Comment | Multiple `todo` comments exist within the imported Bitcoin v0.1.5 source code. These are historical artifacts and can be ignored. |

## 3. Functionality Health Check (Secondary Findings)

*   `tools/test_auditor.py`: **PASS**
*   `tools/auditor.py agent_manager.py`: **PASS**
*   `tools/auditor.py dissonant_manager.py`: **PASS**

## 4. Dependency Audit (Tertiary Findings)

### Outdated NPM Packages (`gemini-citadel/package.json`)

| Package Name | Current Version | Latest Version |
|---|---|---|
| @nomicfoundation/hardhat-ethers | 3.1.0 | 4.0.2 |
| @nomicfoundation/hardhat-ignition | 0.15.13 | 3.0.3 |
| @nomicfoundation/hardhat-ignition-ethers | 0.15.14 | 3.0.3 |
| @nomicfoundation/hardhat-network-helpers| 1.1.0 | 3.0.1 |
| @nomicfoundation/hardhat-verify | 2.1.1 | 3.0.3 |
| @nomicfoundation/ignition-core | 0.15.13 | 3.0.3 |
| @types/chai | 4.3.20 | 5.2.2 |
| @types/node | 24.6.2 | 24.7.2 |
| chai | 4.5.0 | 6.2.0 |
| hardhat | 2.26.3 | 3.0.7 |
| ts-jest | 29.4.4 | 29.4.5 |

### Outdated Pip Packages (`briefing_assistant/requirements.txt`)

| Package Name | Current Version | Latest Version |
|---|---|---|
| blis | 0.7.11 | 1.3.0 |
| cloudpathlib | 0.16.0 | 0.23.0 |
| greenlet | 3.2.3 | 3.2.4 |
| numpy | 1.26.4 | 2.3.3 |
| pip | 25.1.1 | 25.2 |
| playwright | 1.54.0 | 1.55.0 |
| smart-open | 6.4.0 | 7.3.1 |
| spacy | 3.7.2 | 3.8.7 |
| thinc | 8.2.5 | 9.1.1 |
| typer | 0.9.4 | 0.19.2 |
| typing_extensions | 4.14.1 | 4.15.0 |
| weasel | 0.3.4 | 0.4.1 |

### Outdated Pip Packages (`tools/requirements.txt`)

| Package Name | Current Version | Latest Version |
|---|---|---|
| blis | 0.7.11 | 1.3.0 |
| cloudpathlib | 0.16.0 | 0.23.0 |
| greenlet | 3.2.3 | 3.2.4 |
| numpy | 1.26.4 | 2.3.3 |
| nvidia-cublas-cu12 | 12.8.4.1 | 12.9.1.4 |
| nvidia-cuda-cupti-cu12 | 12.8.90 | 12.9.79 |
| nvidia-cuda-nvrtc-cu12 | 12.8.93 | 12.9.86 |
| nvidia-cuda-runtime-cu12 | 12.8.90 | 12.9.79 |
| nvidia-cudnn-cu12 | 9.10.2.21 | 9.14.0.64 |
| nvidia-cufft-cu12 | 11.3.3.83 | 11.4.1.4 |
| nvidia-cufile-cu12 | 1.13.1.3 | 1.14.1.1 |
| nvidia-curand-cu12 | 10.3.9.90 | 10.3.10.19 |
| nvidia-cusolver-cu12 | 11.7.3.90 | 11.7.5.82 |
| nvidia-cusparse-cu12 | 12.5.8.93 | 12.5.10.65 |
| nvidia-cusparselt-cu12 | 0.7.1 | 0.8.1 |
| nvidia-nccl-cu12 | 2.27.3 | 2.28.3 |
| nvidia-nvjitlink-cu12 | 12.8.93 | 12.9.86 |
| nvidia-nvtx-cu12 | 12.8.90 | 12.9.79 |
| pip | 25.1.1 | 25.2 |
| playwright | 1.54.0 | 1.55.0 |
| smart-open | 6.4.0 | 7.3.1 |
| spacy | 3.7.2 | 3.8.7 |
| thinc | 8.2.5 | 9.1.1 |
| triton | 3.4.0 | 3.5.0 |
| typer | 0.9.4 | 0.19.2 |
| typing_extensions | 4.14.1 | 4.15.0 |
| weasel | 0.3.4 | 0.4.1 |