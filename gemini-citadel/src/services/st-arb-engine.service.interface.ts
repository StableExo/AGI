import { ArbitrageOpportunity } from "../models/ArbitrageOpportunity";

export interface IStArbEngine {
    run(): Promise<ArbitrageOpportunity[]>;
}