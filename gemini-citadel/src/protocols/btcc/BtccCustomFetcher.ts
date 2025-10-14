// FILE: gemini-citadel/src/protocols/btcc/BtccCustomFetcher.ts

import { IFetcher } from '../../interfaces/IFetcher';
import axios from 'axios';
import * as crypto from 'crypto';
import { stringify } from 'querystring';

const API_BASE_URL = 'https://spotapi2.btcccdn.com';

export class BtccCustomFetcher implements IFetcher {
    private readonly accessId: string; // This is your API Key
    private readonly secretKey: string; // This is your API Secret / Encryption key

    constructor() {
        this.accessId = process.env.BTCC_API_KEY!;
        this.secretKey = process.env.BTCC_API_SECRET!;

        if (!this.accessId || !this.secretKey) {
            throw new Error("Missing BTCC_API_KEY or BTCC_API_SECRET in environment variables.");
        }
    }

    private generateSignature(params: Record<string, any>): string {
        // Create a new object with the timestamp and access_id
        const paramsWithAuth = {
            ...params,
            tm: Math.floor(Date.now() / 1000), // Timestamp in seconds
            access_id: this.accessId,
        };

        // 1. Splice parameters (excluding secret_key for now)
        const paramString = stringify(paramsWithAuth);

        // 2. Splice the secret_key
        const stringToSign = `${paramString}&secret_key=${this.secretKey}`;

        // 3. Sort the final string alphabetically by key
        const sortedString = stringToSign.split('&').sort().join('&');

        // 4. Get the MD5 value
        return crypto.createHash('md5').update(sortedString).digest('hex');
    }

    // A private helper for making signed requests
    private async makeSignedRequest(method: 'GET' | 'POST', path: string, params: Record<string, any> = {}) {
        const signature = this.generateSignature(params);
        const headers = {
            'authorization': signature
        };

        // The signature function adds tm and access_id, so we need them in the final request
        const finalParams = {
            ...params,
            tm: Math.floor(Date.now() / 1000),
            access_id: this.accessId,
        };

        const url = `${API_BASE_URL}${path}`;

        try {
            if (method === 'GET') {
                const response = await axios.get(url, { headers, params: finalParams });
                return response.data;
            } else { // POST
                const response = await axios.post(url, finalParams, { headers });
                return response.data;
            }
        } catch (error: any) {
            console.error(`[BtccCustomFetcher] API Request FAILED for ${method} ${path}:`, error.response ? error.response.data : error.message);
            throw error;
        }
    }

    // A test function to query user assets, which requires a valid signature
    public async testConnection(): Promise<any> {
        console.log('[BtccCustomFetcher] Testing connection by querying user assets...');
        const assetData = await this.makeSignedRequest('GET', '/btcc_api_trade/asset/query');
        if (assetData && assetData.error === null) {
            console.log('[BtccCustomFetcher] Asset query successful!', assetData.result);
            return assetData;
        } else {
            throw new Error(`Failed to query assets: ${JSON.stringify(assetData)}`);
        }
    }

    // --- Placeholder implementations for IFetcher interface ---
    async fetchPrice(pair: string): Promise<number> { return 0; }
    async fetchOrderBook(pair: string): Promise<any> { return {}; }
}