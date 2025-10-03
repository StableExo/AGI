# Gemini Citadel: System Architecture

## 1. Overview & Core Principles

**Gemini Citadel** is a next-generation automated arbitrage system designed to execute profitable trading opportunities on decentralized exchanges (DEXs). This document outlines the high-level architecture for both the on-chain and off-chain components, using the battle-tested logic of the 'Axion Citadel' project as a blueprint for a new, modernized implementation.

Our architecture is founded on three core principles:

-   **Modularity:** Each component of the system is designed to be independent and self-contained. This allows for easier development, testing, and maintenance. For example, adding a new DEX protocol will be a matter of creating a new module, not re-engineering the core logic.
-   **Resilience:** The system is built for continuous operation. This includes robust error handling, provider fallbacks for blockchain communication, and sophisticated transaction management to handle the realities of a live blockchain environment.
-   **Scalability:** The architecture is designed to grow. It will support the addition of new DEXs, more complex arbitrage strategies (e.g., triangular, multi-hop), and potentially expansion to other EVM-compatible chains in the future.

## 2. System Components

The system is divided into two primary parts: the **On-Chain Executor** (`FlashSwap.sol`) and the **Off-Chain Brain** (a Node.js/TypeScript application).

### 2.1. On-Chain Executor: `FlashSwap.sol`

This is the muscle of the operation, a single, powerful smart contract deployed on the target blockchain.

-   **Responsibilities:**
    -   Acquiring flash loans from integrated liquidity sources (e.g., Uniswap V3, Aave V3).
    -   Executing a precise sequence of swaps as directed by the off-chain brain.
    -   Repaying the flash loan and its associated fee.
    -   Securely distributing any net profit to designated wallets.
-   **Key Features:**
    -   Built with modern, secure Solidity (^0.8.20).
    -   Leverages OpenZeppelin contracts for `Ownable` and `ReentrancyGuard`.
    -   Uses custom errors for gas-efficient and clear revert reasons.
    -   Designed to be stateless, with all arbitrage parameters provided in a single, atomic transaction.

### 2.2. Off-Chain Brain

This is the intelligence of the operation, a sophisticated Node.js application responsible for finding opportunities and directing the on-chain contract. It is composed of several modular services:

-   **Data Service:**
    -   **Responsibility:** To be the system's eyes and ears on the blockchain.
    -   **Function:** Continuously ingests data from multiple DEXs, including pool liquidity, current prices, and token information. It will use a combination of direct contract calls and DEX SDKs.
    -   **Key Feature:** Will maintain a standardized, in-memory representation of the market state for the Strategy Engine to analyze.

-   **Strategy Engine:**
    -   **Responsibility:** To find profitable arbitrage opportunities within the market data.
    -   **Function:** Analyzes the data provided by the Data Service to identify price discrepancies across different pools and tokens.
    -   **Key Feature:** Will initially focus on spatial arbitrage (A -> B on DEX 1, B -> A on DEX 2) and can be extended with more complex strategies like triangular arbitrage.

-   **Execution Service:**
    -   **Responsibility:** To take a potential opportunity, verify it, and execute it.
    -   **Function:**
        1.  **Simulation:** Simulates the identified arbitrage path against a forked or live network state to accurately predict gas costs, swap outputs, and final profit.
        2.  **Transaction Building:** If the simulation is profitable, it constructs the precise `ArbParams` data needed by the `FlashSwap.sol` contract.
        3.  **Transaction Submission:** Submits the transaction to the blockchain, managing nonce, gas price, and connection to a secure RPC provider.
    -   **Key Feature:** This service is the critical link between off-chain analysis and on-chain action.

-   **Configuration Manager:**
    -   **Responsibility:** To manage all settings for the bot.
    -   **Function:** Loads and provides configuration details such as contract addresses, RPC endpoints, private keys (from secure environment variables), and strategy parameters (e.g., minimum profit threshold).

-   **Logging Service:**
    -   **Responsibility:** To provide clear, structured, and persistent logs.
    -   **Function:** Uses a high-performance logger (like Pino) to output detailed information about the bot's operation, including opportunities found, simulations run, transactions sent, and any errors encountered.

## 3. Technology Stack

-   **Blockchain:** EVM-compatible (initially Arbitrum).
-   **Smart Contracts:** Solidity, Hardhat, Ethers.js, OpenZeppelin.
-   **Off-Chain Application:** Node.js, TypeScript.
-   **Blockchain Interaction:** Ethers.js.
-   **Testing:** Jest (for off-chain), Hardhat/Chai (for on-chain).
-   **Package Management:** Yarn.

## 4. High-Level Data Flow

The operational loop of the Gemini Citadel bot is as follows:

1.  **Scan:** The **Data Service** fetches the latest pool and price data from the target DEXs.
2.  **Identify:** The **Strategy Engine** analyzes this data to find a potential arbitrage opportunity.
3.  **Simulate:** The **Execution Service** runs a high-fidelity simulation of the trade, calculating the expected profit after all fees and gas costs.
4.  **Execute:** If the simulated profit exceeds a configured threshold, the **Execution Service** builds the transaction payload and calls the appropriate initiator function (e.g., `initiateUniswapV3FlashLoan`) on our deployed `FlashSwap.sol` contract.
5.  **Confirm:** The **Execution Service** monitors the transaction until it is confirmed on the blockchain, logging the result.
6.  **Repeat:** The loop begins again.

This architectural blueprint will guide the development of the off-chain services and ensure that we build a robust, modular, and scalable arbitrage system.