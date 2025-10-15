// FILE: gemini-citadel/src/protocols/btcc/BtccCustomFetcher.ts

import { IFetcher } from '../../interfaces/IFetcher';
import axios from 'axios';
import * as crypto from 'crypto';
import { stringify } from 'querystring';

const API_BASE_URL = 'https://api.btcc.com';

export class BtccCustomFetcher implements IFetcher {
    private readonly secretKey: string; // This is your API Secret / Encryption key

    constructor() {
        this.secretKey = process.env.BTCC_API_SECRET!;

        if (!this.secretKey) {
            throw new Error("Missing BTCC_API_SECRET in environment variables.");
        }
    }

    private generateSignature(params: Record<string, any>): string {
        // Step 1 & 2: Collect and sort parameters alphabetically
        const sortedParams = Object.keys(params).sort().reduce(
            (obj, key) => {
                obj[key] = params[key];
                return obj;
            },
            {} as Record<string, any>
        );

        // Step 3: Create the pre-hash string from sorted params
        const paramString = Object.entries(sortedParams).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');

        // Step 4: Generate MD5 hash
        return crypto.createHash('md5').update(paramString).digest('hex');
    }

    // A private helper for making signed requests
    private async makeSignedRequest(method: 'GET' | 'POST', path: string, params: Record<string, any> = {}) {
        const paramsWithAuth = {
            ...params,
            secret_key: this.secretKey,
            token: 'placeholder_token',
            accountid: 'placeholder_accountid',
        };

        const signature = this.generateSignature(paramsWithAuth);

        const finalParams: Record<string, any> = {
            ...paramsWithAuth,
            sign: signature,
        };

        // The secret_key is NOT sent in the final request, only used for the signature.
        delete finalParams.secret_key;

        const url = `${API_BASE_URL}${path}`;

        try {
            if (method === 'GET') {
                const response = await axios.get(url, { params: finalParams });
                return response.data;
            } else { // POST
                const response = await axios.post(url, finalParams);
                return response.data;
            }
        } catch (error: any) {
            console.error(`[BtccCustomFetcher] API Request FAILED for ${method} ${path}:`, error.response ? error.response.data : error.message);
            throw error;
        }
    }

    // A private helper for making public, unsigned requests
    private async makePublicRequest(path: string, params: Record<string, any> = {}) {
        const url = `${API_BASE_URL}${path}`;
        try {
            const response = await axios.get(url, { params });
            return response.data;
        } catch (error: any) {
            console.error(`[BtccCustomFetcher] API Request FAILED for GET ${path}:`, error.response ? error.response.data : error.message);
            throw error;
        }
    }

    // A test function to query user assets, which requires a valid signature
    public async testConnection(): Promise<any> {
        console.log('[BtccCustomFetcher] Testing connection by querying account info...');
        // Using the path from the known-working example
        const assetData = await this.makeSignedRequest('GET', '/api/v1/account');
        if (assetData && assetData.code === 0) {
            console.log('[BtccCustomFetcher] Account info query successful!', assetData.data);
            return assetData;
        } else {
            throw new Error(`Failed to query account info: ${JSON.stringify(assetData)}`);
        }
    }

    // --- Placeholder implementations for IFetcher interface ---
    async fetchPrice(pair: string): Promise<number> {
        try {
            console.log(`[BtccCustomFetcher] Fetching price for ${pair}...`);
            // The API likely expects the pair without any separators, e.g., "BTCUSDT"
            const symbol = pair.replace('/', '');
            // Using the correct API path format and the public request method
            const data = await this.makePublicRequest('/api/v1/market/detail', { symbol });

            // Adjusting response check for the new API version
            if (data && data.data && typeof data.data.tick.Last === 'number') {
                console.log(`[BtccCustomFetcher] Successfully fetched price for ${pair}: ${data.data.tick.Last}`);
                return data.data.tick.Last;
            } else {
                // Log the actual data received for diagnostics
                console.error(`[BtccCustomFetcher] Unexpected response structure for ${pair}:`, data);
                throw new Error(`Unexpected response structure for ${pair}.`);
            }
        } catch (error) {
            // The makePublicRequest method already logs the error, so we can just re-throw it.
            console.error(`[BtccCustomFetcher] Failed to fetch price for ${pair}.`);
            throw error;
        }
    }

    async fetchOrderBook(pair: string): Promise<any> { return {}; }
}