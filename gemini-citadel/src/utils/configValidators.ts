import { ethers } from 'ethers';
import logger from '../services/logger.service';

export function validateAndNormalizeAddress(rawAddress: string | undefined, contextName: string): string | null {
    const addressString = String(rawAddress || '').trim();
    if (!addressString) { return null; }
    try {
        const cleanAddress = addressString.replace(/^['"]+|['"]+$/g, '');
        if (!ethers.isAddress(cleanAddress)) {
            logger.warn(`[Config Validate] ${contextName}: Invalid address format "${cleanAddress}".`);
            return null;
        }
        return ethers.getAddress(cleanAddress);
    } catch (error: any) {
        logger.warn(`[Config Validate] ${contextName}: Validation error for "${rawAddress}" - ${error.message}`);
        return null;
    }
}

export function validatePrivateKey(rawKey: string | undefined, contextName: string): string | null {
    const keyString = String(rawKey||'').trim().replace(/^0x/,'');
    const valid = /^[a-fA-F0-9]{64}$/.test(keyString);
    if(!valid) logger.error(`[Config Validate PK] Invalid PK for ${contextName}, length ${keyString.length}`);
    return valid ? keyString : null;
}

export function validateRpcUrls(rawUrls: string | undefined, contextName: string): string[] | null {
    logger.debug(`[ValidateRPC INNER] Received rawUrls for ${contextName}: "${rawUrls}"`);
    const urlsString = String(rawUrls || '').trim();
    if (!urlsString) { logger.error(`[Config Validate] CRITICAL ${contextName}: RPC URL(s) string is empty.`); return null; }
    const urls = urlsString.split(',')
        .map(url => url.trim())
        .filter(url => {
            if (!url) return false;
            const isValidFormat = /^(https?|wss?):\/\/.+/i.test(url);
            if (!isValidFormat) { logger.warn(`[Config Validate] ${contextName}: Invalid URL format skipped: "${url}"`); return false; }
            return true;
        });
    logger.debug(`[ValidateRPC INNER] Filtered URLs count: ${urls.length}`);
    if (urls.length === 0) { logger.error(`[Config Validate] CRITICAL ${contextName}: No valid RPC URLs found.`); return null; }
    logger.debug(`[ValidateRPC INNER] Validation successful for ${contextName}.`);
    return urls;
}

export function safeParseBigInt(valueStr: string | undefined, contextName: string, defaultValue = 0n): bigint {
    try {
        const s = String(valueStr || '').trim();
        if (s.includes('.')) throw new Error("Decimal in BigInt");
        return s ? BigInt(s) : defaultValue;
    } catch (e: any) {
        logger.warn(`[Config Parse BigInt] ${contextName}: Failed "${valueStr}": ${e.message}`);
        return defaultValue;
    }
}

export function safeParseInt(valueStr: string | undefined, contextName: string, defaultValue = 0): number {
    const n = parseInt(String(valueStr || '').trim(), 10);
    if (isNaN(n)) {
        logger.warn(`[Config Parse Int] ${contextName}: Failed "${valueStr}"`);
        return defaultValue;
    }
    return n;
}

export function parseBoolean(valueStr: string | undefined): boolean {
    return String(valueStr || '').trim().toLowerCase() !== 'false';
}
