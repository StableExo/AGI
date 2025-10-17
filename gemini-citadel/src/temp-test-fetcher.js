"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const BtccCustomFetcher_1 = require("./protocols/btcc/BtccCustomFetcher");
async function testFetcher() {
    console.log('--- Starting Focused Fetcher Test ---');
    try {
        const fetcher = new BtccCustomFetcher_1.BtccCustomFetcher();
        const price = await fetcher.fetchPrice('BTC/USDT');
        console.log(`[SUCCESS] Fetched price: ${price}`);
    }
    catch (error) {
        console.error('[FAILURE] Test failed:', error);
    }
    console.log('--- Focused Fetcher Test Complete ---');
}
testFetcher();
