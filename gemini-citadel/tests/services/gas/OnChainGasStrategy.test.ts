import { OnChainGasStrategy } from "../../../src/services/gas/OnChainGasStrategy";
import { JsonRpcProvider } from "ethers";
import { ArbitrageOpportunity } from "../../../src/models/ArbitrageOpportunity";
import { ITradeAction } from "../../../src/models/ITradeAction";

// Mock the JsonRpcProvider
jest.mock("ethers", () => {
  const originalEthers = jest.requireActual("ethers");
  return {
    ...originalEthers,
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getFeeData: jest.fn().mockResolvedValue({
        maxFeePerGas: 20000000000n, // 20 Gwei
        maxPriorityFeePerGas: 1000000000n, // 1 Gwei
      }),
    })),
  };
});

describe("OnChainGasStrategy", () => {
  let gasStrategy: OnChainGasStrategy;

  beforeEach(() => {
    gasStrategy = new OnChainGasStrategy();
  });

  it("should return the provider's suggested fees when no opportunity is provided", async () => {
    const gasPrice = await gasStrategy.calculateGasPrice();
    expect(gasPrice.maxFeePerGas.toString()).toBe("20000000000");
    expect(gasPrice.maxPriorityFeePerGas.toString()).toBe("1000000000");
  });

  it("should calculate a lower maxFeePerGas based on the opportunity's profit", async () => {
    const tradeActions: ITradeAction[] = [];
    const opportunity = new ArbitrageOpportunity(
      1000000000000000n, // 0.001 ETH profit
      tradeActions
    );

    const gasPrice = await gasStrategy.calculateGasPrice(opportunity);
    // maxGasCostInWei (profit) / gasLimit (200000) = 5000000000 (5 Gwei)
    expect(gasPrice.maxFeePerGas.toString()).toBe("5000000000");
    expect(gasPrice.maxPriorityFeePerGas.toString()).toBe("1000000000");
  });

  it("should use the provider's suggested maxFeePerGas if it's lower than the calculated one", async () => {
    const tradeActions: ITradeAction[] = [];
    const opportunity = new ArbitrageOpportunity(
      100000000000000000n, // 0.1 ETH profit
      tradeActions
    );
    const gasPrice = await gasStrategy.calculateGasPrice(opportunity);
    // maxGasCostInWei (profit) / gasLimit (200000) = 500000000000 (500 Gwei)
    // Provider's maxFeePerGas is 20 Gwei, so it should use that.
    expect(gasPrice.maxFeePerGas.toString()).toBe("20000000000");
    expect(gasPrice.maxPriorityFeePerGas.toString()).toBe("1000000000");
  });
});
