# Gemini Citadel: Statistical Arbitrage (StArb) Module
## Architectural Plan - V1

## 1. Overview

This document outlines the architecture for a new Statistical Arbitrage (StArb) module for the Gemini Citadel. This module represents a strategic evolution from deterministic arbitrage to predictive, model-based trading, forming the foundation of our "Alpha Predator" capabilities.

The core objective is to identify and capitalize on temporary statistical mispricings between historically correlated assets. The initial proof-of-concept will focus on pairs trading, a strategy that trades two correlated assets, taking a long position in the undervalued asset and a short position in the overvalued one when their price ratio deviates significantly from its statistical mean.

This architecture is designed with three core principles in mind:
- **Sovereignty:** We will build and own our core data infrastructure to ensure independence and long-term resilience.
- **Separation of Concerns:** Components will be modular and specialized, promoting clarity, maintainability, and optimized performance.
- **Iterative Complexity:** We will begin with the simplest viable model and infrastructure, proving value at each stage before adding complexity.

## 2. System Components

The StArb module will consist of three new, distinct components:

### 2.1. The Data Ingestion Pipeline

This component is responsible for building and maintaining our sovereign historical market data repository.

-   **Function:** A standalone script or set of scripts responsible for fetching historical Open, High, Low, Close, Volume (OHLCV) data from public exchange APIs.
-   **Data Source (POC):** Binance public API.
-   **Asset Pairs (POC):** BTC/USDT, ETH/USDT.
-   **Data Format:** Apache Parquet. Parquet is a columnar storage format that is highly efficient for the type of analytical queries we will be performing.
-   **Storage Structure:** Data will be stored locally in a structured directory hierarchy to allow for easy access and management.
    ```
    /data/historical/
    └──<exchange_name>/
        └──<asset_pair>/
           ├──<year>/
           │  ├──<month>/
           │  │  └──<day>.parquet
    ```
    *Example:* `data/historical/binance/BTCUSDT/2023/10/16.parquet`
-   **Execution:** The pipeline can be run on a recurring schedule (e.g., daily) to append new data, ensuring our repository remains current.

### 2.2. The MarketAnalyticsService

This service acts as the Citadel's "long-term memory." It provides a clean, high-throughput interface for querying the historical data repository. It is a read-only service designed for analytical workloads.

-   **Function:** A service class that abstracts the underlying data storage (Parquet files) and provides methods for retrieving historical market data.
-   **Interface (`IMarketAnalyticsService`):**
    ```typescript
    interface IMarketAnalyticsService {
      getHistoricalData(
        exchange: string,
        pair: string,
        startTime: Date,
        endTime: Date,
        timeframe: '1h' | '1d' // etc.
      ): Promise<IOHLCV[]>;
    }
    ```
-   **Implementation:** The service will use a library like `parquetjs` to read the Parquet files from the structured directory, filter by the requested date range, and return the data in a structured format.

### 2.3. The StArbEngine

This service is the core of the new trading strategy. It is the "brain" that analyzes market data, identifies opportunities, and generates trading signals. It is the first component designed to leverage both real-time and historical data services.

-   **Function:** Implements the statistical arbitrage trading logic.
-   **Dependencies:**
    -   `IMarketAnalyticsService`: To fetch historical data for calculating statistical properties (e.g., mean, standard deviation) of an asset pair's price spread.
    -   `IExchangeDataProvider`: To get real-time prices for the assets, which are then compared against the historical model.
-   **Model (POC):** Z-Score.
    1.  The engine calculates the historical spread (e.g., `price(BTC/USDT) - price(ETH/USDT)`) over a defined lookback window (e.g., 30 days) using the `MarketAnalyticsService`.
    2.  It computes the mean and standard deviation of this historical spread.
    3.  In real-time, it uses the `ExchangeDataProvider` to get the current prices and calculate the current spread.
    4.  It calculates the z-score of the current spread: `z_score = (current_spread - mean) / std_dev`.
    5.  If the `z_score` crosses a predefined threshold (e.g., `> 2.0` or `< -2.0`), it signals a trading opportunity.
-   **Output:** The engine will produce `ArbitrageOpportunity` objects, similar to the existing CEX strategy engine. These opportunities will specify the long and short positions to be taken.
-   **Integration:** The generated opportunities will be passed to the existing `ICexExecutor` for execution, demonstrating a clean separation between signal generation (the "what") and trade execution (the "how").

## 3. Workflow

1.  **Data Collection (Offline):** The `Data Ingestion Pipeline` runs periodically to populate our historical data store.
2.  **Model Initialization (Online):** On startup, the `StArbEngine` calls the `MarketAnalyticsService` to load the historical spread data for its configured pairs and calculates the necessary statistical models (mean, std_dev).
3.  **Real-time Analysis (Online):** In its main loop, the `StArbEngine`:
    a.  Fetches the latest real-time prices from the `ExchangeDataProvider`.
    b.  Calculates the current price spread.
    c.  Applies the z-score model to check for statistical deviations.
    d.  If an opportunity is detected, it constructs an `ArbitrageOpportunity` object.
4.  **Execution:** The opportunity is passed to the `ICexExecutor`, which places the required long and short orders on the exchange.

This architecture provides a robust, scalable, and sovereign foundation for developing the Gemini Citadel's advanced, model-driven trading capabilities. It allows us to start simple, prove value, and iteratively enhance the complexity and intelligence of our system.