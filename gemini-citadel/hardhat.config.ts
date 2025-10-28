import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import "@nomicfoundation/hardhat-ignition-ethers";
import "dotenv/config";

const privateKey = process.env.EXECUTION_PRIVATE_KEY;
if (!privateKey) {
  console.warn("EXECUTION_PRIVATE_KEY is not set in the environment. Deployments will fail.");
}

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    base: {
      url: process.env.RPC_URL || "",
      accounts: privateKey ? [privateKey] : [],
    },
  },
};

export default config;
