const { HardhatUserConfig } = require("hardhat/config");
require("@nomicfoundation/hardhat-toolbox");
require('dotenv/config');

const forkingConfig = process.env.RPC_URL
  ? {
      url: process.env.RPC_URL,
    }
  : undefined;

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
    ],
  },
  networks: {
    hardhat: {
      forking: forkingConfig,
      hardfork: "cancun",
    },
    base: {
      url: process.env.RPC_URL || "",
      accounts: process.env.EXECUTION_PRIVATE_KEY
        ? [process.env.EXECUTION_PRIVATE_KEY]
        : [],
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
  },
};

module.exports = config;
