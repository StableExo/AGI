// hardhat.config.cts
const { HardhatUserConfig } = require("hardhat/config");
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ignition-ethers");
require("dotenv/config");

const config: typeof HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,  // Higher for complex arbitrage logic
      },
      viaIR: true,
    },
  },
  networks: {
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
    base: {
      url: process.env.BASE_RPC_URL || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
    // Add other chains for cross-chain arbitrage
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    // Critical for arbitrage profit calculations
  }
};

module.exports = config;
