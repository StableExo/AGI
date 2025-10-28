const { HardhatUserConfig } = require("hardhat/config");
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ignition-ethers");
require("dotenv/config");

const privateKey = process.env.EXECUTION_PRIVATE_KEY;
if (!privateKey) {
  console.warn("EXECUTION_PRIVATE_KEY is not set in the environment. Deployments will fail.");
}

const config = {
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

module.exports = config;
