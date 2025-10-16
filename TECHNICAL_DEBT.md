# Technical Debt Log - Operation Mjolnir (Phase 1)

This document lists dependency updates that were identified but not performed during Phase 1 of Operation Mjolnir. These updates are deferred because they involve major version changes, which are out of scope for the initial dependency update initiative.

## Node.js (`gemini-citadel/package.json`)

| Package | Current Version | Latest Version | Reason for Deferral |
|---|---|---|---|
| `@nomicfoundation/hardhat-ethers` | `3.1.0` | `4.0.2` | Major version update |
| `@nomicfoundation/hardhat-ignition` | `0.15.13` | `3.0.3` | Major version update |
| `@nomicfoundation/hardhat-ignition-ethers` | `0.15.14` | `3.0.3` | Major version update |
| `@nomicfoundation/hardhat-network-helpers` | `1.1.0` | `3.0.1` | Major version update |
| `@nomicfoundation/hardhat-verify` | `2.1.1` | `3.0.3` | Major version update |
| `@nomicfoundation/ignition-core` | `0.15.13` | `3.0.3` | Major version update |
| `chai` | `4.5.0` | `6.2.0` | Major version update |
| `hardhat` | `2.26.3` | `3.0.7` | Major version update |

## Python (`requirements.txt`)

| Package | Current Version | Latest Version | Reason for Deferral |
|---|---|---|---|
| `spacy` | `3.7.2` | `3.8.7` | Blocked by `en-core-web-sm==3.7.1` which requires `spacy<3.8.0`. |
| `cloudpathlib` | `0.16.0` | `0.23.0` | Blocked by `spacy==3.7.2` dependency constraints. |
| `smart-open` | `6.4.0` | `7.3.1` | Blocked by `spacy==3.7.2` dependency constraints. |
| `typer` | `0.9.4` | `0.19.2` | Blocked by `spacy==3.7.2` dependency constraints. |
| `weasel` | `0.3.4` | `0.4.1` | Blocked by `spacy==3.7.2` dependency constraints. |