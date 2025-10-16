# Guardian Protocol: Architectural Design Document

## 1. Introduction

The Guardian Protocol establishes a secure, human-in-the-loop system for managing the Citadel's Treasury. It allows the automated trading engine to request capital and report profits without ever having direct control over private keys. The final authorization for any movement of funds from the Treasury always resides with the human operator.

This document details the architecture of the three core components of this protocol:
- **The Wallet Connector**: A secure bridge to the human operator's Coinbase Wallet.
- **The Treasury Manager**: The stateful service that orchestrates funding requests.
- **The Approval Gateway**: The end-to-end workflow that connects the system.

## 2. Core Principles

The design is founded on two non-negotiable principles:

1.  **Strict Proposal-Only Flow**: The Citadel can only *propose* transactions. All signing and broadcasting is performed exclusively by the human operator from their secure wallet environment. At no point does a signed transaction or private key enter the Citadel's process space.
2.  **Blockchain as the Source of Truth**: The system does not rely on direct feedback from the wallet application. Instead, it monitors the blockchain for immutable, on-chain proof of a transaction's success. This makes the system resilient to user inaction, network issues, or explicit rejections.

## 3. Component Architecture

### 3.1. The Wallet Connector

The `WalletConnector` is a service responsible for all direct communication with the human operator's wallet.

- **Technology**: **Coinbase Wallet SDK**. This was chosen over WalletConnect v2.0 to provide the most direct and reliable integration with the specified Coinbase Wallet target.
- **Purpose**: To provide a standardized, secure interface for proposing transactions to the operator's wallet for their explicit approval.
- **Implementation File**: `gemini-citadel/src/services/WalletConnector.service.ts`

#### 3.1.1. Interface (`IWalletConnector.interface.ts`)

```typescript
export interface ITransactionProposal {
  to: string;          // The recipient address (e.g., CEX deposit address)
  value: string;       // The amount of ETH/native currency to send, in wei
  data?: string;        // Optional data for contract interactions (e.g., ERC20 transfer)
  from?: string;        // The sender address (our Treasury wallet)
}

export interface IERC20TransferProposal {
  to: string;          // The CEX deposit address
  contractAddress: string; // The address of the ERC20 token contract
  amount: string;      // The amount of the token to send, in its smallest unit
}

export interface IWalletConnector {
  proposeTransaction(proposal: ITransactionProposal): Promise<string>;
  proposeERC20Transfer(proposal: IERC20TransferProposal): Promise<string>;
  initialize(): Promise<void>;
  disconnect(): Promise<void>;
  getAddress(): string | null;
}
```

### 3.2. The Treasury Manager

The `TreasuryManager` is the brain of the Guardian Protocol. It orchestrates the entire lifecycle of a funding request.

- **Purpose**: To manage the state of funding requests, interact with the `WalletConnector`, monitor the blockchain for confirmations, and handle all operational logic related to the Treasury.
- **Implementation File**: `gemini-citadel/src/services/TreasuryManager.service.ts`

#### 3.2.1. Interface (`ITreasuryManager.interface.ts`)

```typescript
export enum FundingRequestStatus {
  PENDING = 'PENDING',
  PROPOSED = 'PROPOSED',
  AWAITING_CONFIRMATION = 'AWAITING_CONFIRMATION',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  TIMED_OUT = 'TIMED_OUT',
  FAILED = 'FAILED',
}

export interface FundingRequest {
  id: string;
  exchange: string;
  asset: string;
  amount: string;
  status: FundingRequestStatus;
  proposeTxHash?: string;
  confirmTxHash?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ITreasuryManager {
  requestFunding(exchange: string, asset: string, amount: string): Promise<string>;
  depositProfits(exchange: string, asset: string, amount: string): Promise<void>;
  getRequestStatus(id: string): Promise<FundingRequest | null>;
}
```

#### 3.2.2. Key Architectural Features

-   **State Machine**: Tracks each request through the `FundingRequestStatus` enum.
-   **On-Chain Monitoring**: After a transaction is proposed, the service will use a read-only `JsonRpcProvider` to listen for the corresponding on-chain transaction from the Treasury wallet to the destination address. This is the sole mechanism for confirming success.
-   **Timeout Logic**: A 15-minute timeout is initiated for each request. If no on-chain confirmation is detected within this window, the request is marked as `TIMED_OUT`.
-   **Profit Reporting**: The `depositProfits` method is a notification-only system to alert the human operator to perform a manual withdrawal from a CEX.

## 4. Approval Gateway Workflow

The following diagram illustrates the complete end-to-end workflow for a `requestFunding` call.

```mermaid
sequenceDiagram
    participant CexStrategyEngine as CexStrategyEngine
    participant TreasuryManager as TreasuryManager
    participant WalletConnector as WalletConnector
    participant HumanOperator as Human Operator (Coinbase Wallet)
    participant Ethereum as Ethereum Blockchain

    CexStrategyEngine->>+TreasuryManager: requestFunding(exchange, asset, amount)
    TreasuryManager->>TreasuryManager: Create FundingRequest (status: PENDING)
    TreasuryManager-->>-CexStrategyEngine: Return requestId

    Note over TreasuryManager: Process request async

    TreasuryManager->>+WalletConnector: proposeERC20Transfer(proposal)
    WalletConnector->>+HumanOperator: SDK triggers signing prompt

    par
        HumanOperator->>WalletConnector: Approves Transaction
        WalletConnector-->>-TreasuryManager: Returns proposal txHash
        TreasuryManager->>TreasuryManager: Update request (status: PROPOSED)
        TreasuryManager->>+Ethereum: Start monitoring for on-chain tx
        Note over TreasuryManager, Ethereum: Set 15 min timeout

        HumanOperator->>+Ethereum: Signs & broadcasts transaction
        Ethereum->>Ethereum: Transaction is mined

        Ethereum-->>-TreasuryManager: Monitoring service detects confirmed tx
        TreasuryManager->>TreasuryManager: Update request (status: CONFIRMED)

    or
        HumanOperator->>WalletConnector: Rejects Transaction
        WalletConnector-->>-TreasuryManager: Throws rejection error
        TreasuryManager->>TreasuryManager: Update request (status: REJECTED)

    or
        Note over HumanOperator: Ignores request
        Note over TreasuryManager, Ethereum: 15 min timeout expires
        TreasuryManager->>TreasuryManager: Update request (status: TIMED_OUT)
    end
```

This architecture provides a secure, resilient, and auditable foundation for managing the Citadel's live market operations.