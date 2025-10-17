"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@nomicfoundation/hardhat-toolbox");
require("dotenv/config");
const config = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            },
            viaIR: true
        }
    },
    networks: {
        base: {
            url: process.env.RPC_URL || '',
            accounts: process.env.EXECUTION_PRIVATE_KEY ? [process.env.EXECUTION_PRIVATE_KEY] : [],
        },
    },
};
exports.default = config;
