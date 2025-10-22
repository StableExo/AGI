import { ArbitrageOpportunity } from "./ArbitrageOpportunity";

export interface GasPrice {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

export interface IGasStrategy {
  calculateGasPrice(opportunity?: ArbitrageOpportunity): Promise<GasPrice>;
}
