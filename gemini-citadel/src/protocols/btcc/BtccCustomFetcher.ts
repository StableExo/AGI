// FILE: gemini-citadel/src/protocols/btcc/BtccCustomFetcher.ts

import { IFetcher } from '../../interfaces/IFetcher';
import axios from 'axios';
import * as crypto from 'crypto';

const API_BASE_URL = 'https://api1.btloginc.com:9081';

export class BtccCustomFetcher implements IFetcher {
    private readonly apiKey: string;
    private readonly apiSecret: string;
    private readonly username?: string;
    private readonly password?: string;

    private sessionToken: string | null = null;
    private accountId: number | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.apiKey = process.env.BTCC_API_KEY!;
        this.apiSecret = process.env.BTCC_API_SECRET!;
        this.username = process.env.BTCC_USERNAME;
        this.password = process.env.BTCC_PASSWORD;

        if (!this.apiKey || !this.apiSecret || !this.username || !this.password) {
            throw new Error("Missing BTCC credentials in environment variables.");
        }
    }

    private generateSignature(params: Record<string, any>): string {
        const tempParams: Record<string, any> = { ...params, secret_key: this.apiSecret };
        const sortedKeysWithSecret = Object.keys(tempParams).sort();
        const paramString = sortedKeysWithSecret
            .map(key => `${key}=${tempParams[key]}`)
            .join('&');

        return crypto.createHash('md5').update(paramString).digest('hex');
    }

    public async initialize(): Promise<void> {
        console.log('[BtccCustomFetcher] Attempting to log in and create session...');

        const loginParams = {
            user_name: this.username!,
            password: this.password!,
            company_id: 1,
            api_key: this.apiKey
        };

        const signature = this.generateSignature(loginParams);

        const finalParams = { ...loginParams, sign: signature };

        try {
            const response = await axios.post(`${API_BASE_URL}/v1/user/login`, null, { params: finalParams });

            if (response.data && response.data.code === 0) {
                this.sessionToken = response.data.token;
                this.accountId = response.data.account.id;
                console.log(`[BtccCustomFetcher] Login SUCCESSFUL! Session token and account ID acquired.`);
                // this.startHeartbeat(); // To be implemented
            } else {
                console.error('[BtccCustomFetcher] Login FAILED.', response.data);
                throw new Error(`BTCC Login Failed: ${response.data.msg || 'Unknown error'}`);
            }
        } catch (error: any) {
            console.error('[BtccCustomFetcher] CRITICAL ERROR during login:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    // --- Placeholder implementations for IFetcher interface ---
    async fetchPrice(pair: string): Promise<number> { return 0; }
    async fetchOrderBook(pair: string): Promise<any> { return {}; }
}