import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'dotenv/config';

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
          viaIR: true
        }
      },
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
          viaIR: true
        }
      }
    ]
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.RPC_URL || '',
      },
      hardfork: "cancun"
    },
    base: {
      url: process.env.RPC_URL || '',
      accounts: process.env.EXECUTION_PRIVATE_KEY ? [process.env.EXECUTION_PRIVATE_KEY] : [],
    },
  },
};

export default config;