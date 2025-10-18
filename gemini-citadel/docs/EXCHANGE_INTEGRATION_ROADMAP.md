# Exchange Integration Roadmap

This document outlines the research, requirements, and integration status for adding new Centralized (CEX) and Decentralized (DEX) exchanges to the Gemini Citadel bot.

## Phase 1: Initial Integration Targets

Our initial focus is on the top 3 CEXs and DEXs by trading volume.

### Centralized Exchanges (CEX)

| Rank | Exchange | Status | Credentials Needed | Notes |
|:----:|:---|:---|:---|:---|
| 1 | Binance | Research Complete | API Key & Secret Key | Requires "Enable Spot & Margin Trading" permissions. Supported by `ccxt`. |
| 2 | KuCoin | Research Complete | API Key, Secret, & Passphrase | Requires "Spot Trading" permissions. Supported by `ccxt`. |
| 3 | MEXC | Research Complete | API Key & Secret Key | Requires "Spot Trading" permissions. Supported by `ccxt`. |

### Decentralized Exchanges (DEX)

All DEX integrations will target the **Base Network**.

| Rank | Exchange | Status | On Base? | Contract Addresses | Notes |
|:----:|:---|:---|:---|:---|:---|
| 1 | Aster | To Be Researched | To Be Determined | To Be Determined | |
| 2 | Hyperliquid | To Be Researched | To Be Determined | To Be Determined | |
| 3 | PancakeSwap | To Be Researched | To Be Determined | To Be Determined | |