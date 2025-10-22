import { JsonRpcProvider } from "ethers";
import { IGasStrategy, GasPrice } from "../../models/IGasStrategy";
import { ArbitrageOpportunity } from "../../models/ArbitrageOpportunity";
import { botConfig } from "../../config/bot.config";

export class OnChainGasStrategy implements IGasStrategy {
  private provider: JsonRpcProvider;

  constructor() {
    this.provider = new JsonRpcProvider(botConfig.treasury.rpcUrl);
  }

  async calculateGasPrice(opportunity?: ArbitrageOpportunity): Promise<GasPrice> {
    const feeData = await this.provider.getFeeData();

    // Simple strategy: use the provider's suggested fees.
    // In the future, we can analyze the fee history for a more sophisticated calculation.
    if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
      throw new Error("Fee data is not available");
    }

    let maxFeePerGas = feeData.maxFeePerGas;
    let maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

    if (opportunity) {
      // Gross Profit - Flash Loan Fee - Minimum Required Profit.
      const maxGasCostInWei = opportunity.profit; // Assuming profit is in wei
      const gasLimit = 200000n; // A rough estimate, this should be improved.
      const maxGasPrice = maxGasCostInWei / gasLimit;

      if (maxGasPrice < maxFeePerGas) {
        maxFeePerGas = maxGasPrice;
      }
    }

    return {
      maxFeePerGas,
      maxPriorityFeePerGas,
    };
  }
}
