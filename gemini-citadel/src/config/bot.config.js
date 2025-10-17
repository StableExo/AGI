"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.botConfig = void 0;
require("dotenv/config");
exports.botConfig = {
    loopIntervalMs: process.env.LOOP_INTERVAL_MS ? parseInt(process.env.LOOP_INTERVAL_MS, 10) : 10000,
    exchanges: [
        {
            name: 'btcc',
            type: 'CEX',
            enabled: false, // Disabling until fully implemented
            fee: 0.001,
            apiKey: process.env.BTCC_API_KEY,
            apiSecret: process.env.BTCC_API_SECRET,
        },
        {
            name: 'coinbase',
            type: 'CEX',
            enabled: true, // Enabled for reconnaissance
            fee: 0.005,
            apiKey: process.env.COINBASE_API_KEY,
            apiSecret: process.env.COINBASE_API_SECRET,
        },
        {
            name: 'binance',
            type: 'CEX',
            enabled: false, // Geoblocked in this environment
            fee: 0.001, // Standard Binance fee
            apiKey: process.env.BINANCE_API_KEY,
            apiSecret: process.env.BINANCE_API_SECRET,
        },
        {
            name: 'kraken',
            type: 'CEX',
            enabled: true, // Enabled for reconnaissance
            fee: 0.0016, // Standard Kraken fee
            apiKey: process.env.KRAKEN_API_KEY,
            apiSecret: process.env.KRAKEN_API_SECRET,
        },
        {
            name: 'mockExchange',
            type: 'DEX',
            enabled: true,
            fee: 0.001,
        }
    ],
    btcc: {
        apiUrl: process.env.BTCC_API_URL || 'https://spotapi.btcc.com',
    },
    treasury: {
        walletAddress: process.env.TREASURY_WALLET_ADDRESS || '0x9358D67164258370B0C07C37d3BF15A4c97b8Ab3',
        rpcUrl: process.env.ETH_MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID', // Placeholder
    }
};
