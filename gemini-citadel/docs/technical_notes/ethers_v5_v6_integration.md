# Ethers v5 & v6 Integration Guide

**Date:** 2025-10-09
**Author:** Jules

## 1. Overview

This document outlines the best practices for integrating and managing both `ethers` v5 and `ethers` v6 within the `gemini-citadel` project. This dual-dependency is necessary because the core application logic is built on the modern `ethers` v6, while the Uniswap V3 SDK, a critical dependency, requires `ethers` v5 for its peer dependencies.

## 2. The Problem: Provider Instantiation Failures

During initial development, the application experienced intermittent but consistent errors related to the `ethers-v5` provider failing to connect to the Arbitrum RPC endpoint.

### Root Cause Analysis

The root cause was traced to the network auto-detection mechanism in the standard `ethers-v5` `JsonRpcProvider`. This provider attempts to detect the network on every instantiation. This process proved to be brittle and unreliable with certain RPC endpoints, leading to connection failures.

The `ethers` v6 `JsonRpcProvider` also performs this check, but a more robust, efficient pattern is available.

## 3. The Solution: Static Providers

To resolve this, we have implemented a more robust provider instantiation strategy for both versions of `ethers` in `src/services/data.service.ts`.

### 3.1. Ethers v5: `StaticJsonRpcProvider`

Instead of the standard `JsonRpcProvider`, we now use `providersV5.StaticJsonRpcProvider`.

**Implementation:**
```typescript
// src/services/data.service.ts

// For v5, we use StaticJsonRpcProvider. The standard JsonRpcProvider's
// auto-detection can be brittle. StaticJsonRpcProvider detects the network
// once and caches it, which is more reliable.
this.providerV5 = new providersV5.StaticJsonRpcProvider(rpcUrl);
```

**Rationale:**
The `StaticJsonRpcProvider` is designed for this exact scenario. It queries the network (e.g., `eth_chainId`) only **once** upon initialization and then caches the result. All subsequent operations use this cached network information, completely avoiding the unreliable auto-detection on subsequent calls.

### 3.2. Ethers v6: `JsonRpcProvider` with `staticNetwork`

For `ethers` v6, the `StaticJsonRpcProvider` functionality has been merged into the main `JsonRpcProvider`. The same caching behavior can be achieved by passing a `{ staticNetwork: true }` option during instantiation.

**Implementation:**
```typescript
// src/services/data.service.ts

// For v6, we connect once and cache the network. This is more efficient.
this.provider = new JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
```

**Rationale:**
This is the modern, recommended approach for `ethers` v6. It provides the same efficiency and reliability benefits as the `StaticJsonRpcProvider` in v5.

## 4. Best Practices & Mandates

1.  **Centralized Instantiation:** All provider instances (`v5` and `v6`) are to be instantiated **once** in the `DataService` constructor and stored as class properties. This prevents the overhead of creating new provider connections on every function call.
2.  **Use Static Providers:** Always use the static provider patterns described above (`StaticJsonRpcProvider` for v5, `{ staticNetwork: true }` for v6) to ensure reliable and efficient network connections.
3.  **Update Unit Tests:** When modifying provider logic, the corresponding unit tests (e.g., `data.service.test.ts`) **must** be updated. This includes mocking the correct provider class (`StaticJsonRpcProvider` instead of `JsonRpcProvider`).
4.  **Dependency Aliasing:** The `ethers-v5` dependency is managed via a package alias in `package.json` to prevent conflicts with the primary `ethers` v6 package. This is a stable configuration and should be maintained.
    ```json
    "dependencies": {
      "ethers-v5": "npm:ethers@^5.7.2"
    }
    ```