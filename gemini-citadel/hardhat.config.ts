import { HardhatUserConfig } from "hardhat/config";
// Import the recommended toolbox plugin
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import "@nomicfoundation/hardhat-ignition-ethers";

const config: HardhatUserConfig = {
  // Plugins must be declared in this array
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

export default config;
