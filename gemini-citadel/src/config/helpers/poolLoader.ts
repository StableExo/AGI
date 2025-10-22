// gemini-citadel/src/config/helpers/poolLoader.ts
import { ethers } from 'ethers';
import * as Validators from './validators';
import logger from '../../services/logger.service';

// --- Helper function to safely require pool definition files ---
async function requirePoolFile(networkName: string, dexType: string): Promise<any[]> {
    const filenameMap: { [key: string]: string } = {
        uniswapV3: 'uniswapV3.ts',
        sushiSwap: 'sushiSwap.ts',
        dodo: 'dodo.ts'
    };
    const exportKeyMap: { [key: string]: string } = {
        uniswapV3: 'UNISWAP_V3_POOLS',
        sushiSwap: 'SUSHISWAP_POOLS',
        dodo: 'DODO_POOLS'
    };

    const filename = filenameMap[dexType];
    const expectedKey = exportKeyMap[dexType];

    if (!filename || !expectedKey) {
        logger.error(`[Pool Loader] Invalid internal dexType "${dexType}" provided to requirePoolFile.`);
        return [];
    }

    const filePath = `../pools/${networkName}/${filename}`;
    try {
        logger.debug(`[Pool Loader] Attempting to load pool file: ${filePath} for key ${expectedKey}`);
        const poolModule = await import(filePath);

        if (poolModule && Array.isArray(poolModule[expectedKey])) {
             logger.debug(`[Pool Loader] Successfully loaded ${poolModule[expectedKey].length} pools for ${dexType} using key "${expectedKey}" from ${filePath}`);
             return poolModule[expectedKey];
        } else {
             logger.warn(`[Pool Loader] Pool file found at ${filePath}, but missing, invalid, or not an array export key "${expectedKey}".`);
             return [];
        }
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
            logger.warn(`[Pool Loader] Pool definition file not found for ${dexType} at ${filePath}. Skipping ${dexType} pools.`);
        } else {
            logger.error(`[Pool Loader] Error loading pool file ${filePath}: ${(error as Error).message}`);
        }
        return [];
    }
}
// --- End Helper ---

export async function loadPoolConfigs(networkName: string, baseTokens: any, isV3Enabled: boolean, isSushiEnabled: boolean, isDodoEnabled: boolean): Promise<any[]> {
    logger.debug('[Pool Loader] Starting pool configuration loading from dedicated files...');
    const allPoolConfigs: any[] = [];
    const loadedPoolAddresses = new Set<string>();

    if (isV3Enabled) {
        const uniswapV3Pools = await requirePoolFile(networkName, 'uniswapV3');
        logger.debug(`[Pool Loader] Processing ${uniswapV3Pools.length} raw V3 pools...`);
        for (const group of uniswapV3Pools) {
            const token0 = baseTokens[group.token0Symbol];
            const token1 = baseTokens[group.token1Symbol];
            if (!token0 || !token1) { logger.warn(`[Pool Loader] V3 Group ${group.name}: Skipping due to missing token def: ${group.token0Symbol}/${group.token1Symbol}.`); continue; }
            const pairTokenObjects = [token0, token1];
            if (!group.feeTierToEnvMap || typeof group.feeTierToEnvMap !== 'object') { logger.warn(`[Pool Loader] V3 Group ${group.name}: Skipping due to invalid feeTierToEnvMap.`); continue; }

            for (const feeTierStr in group.feeTierToEnvMap) {
                const envVarName = group.feeTierToEnvMap[feeTierStr];
                if (!envVarName || typeof envVarName !== 'string') continue;
                const fee = parseInt(feeTierStr, 10);
                if (isNaN(fee)) { logger.warn(`[Pool Loader] V3 Group ${group.name}: Invalid fee tier "${feeTierStr}".`); continue; }

                const poolAddress = Validators.validateAndNormalizeAddress(process.env[envVarName], envVarName);
                if (poolAddress && poolAddress !== ethers.ZeroAddress) {
                    const lowerCaseAddress = poolAddress.toLowerCase();
                    if (loadedPoolAddresses.has(lowerCaseAddress)) { continue; }
                    allPoolConfigs.push({ address: poolAddress, dexType: 'uniswapV3', fee: fee, token0Symbol: group.token0Symbol, token1Symbol: group.token1Symbol, pair: pairTokenObjects, groupName: group.name || 'N/A' });
                    loadedPoolAddresses.add(lowerCaseAddress);
                    logger.debug(`[Pool Loader] Added V3 Pool: ${poolAddress} (${group.name} ${fee}bps)`);
                } else if (process.env[envVarName]) { logger.warn(`[Pool Loader] V3 Group ${group.name}: Invalid address env var ${envVarName}: "${process.env[envVarName]}".`); }
            }
        }
    } else {
        logger.info("[Pool Loader] Uniswap V3 pools disabled by config.");
    }

    // --- Other DEX types can be added here ---

    logger.info(`[Pool Loader] Finished processing. Total unique pools loaded: ${loadedPoolAddresses.size}`);
    if (loadedPoolAddresses.size === 0 && (isV3Enabled || isSushiEnabled || isDodoEnabled)) {
        logger.error("[Pool Loader] CRITICAL WARNING: DEXs are enabled but NO pool addresses were loaded. Check .env variables and pool definition files in config/pools/");
    }

    return allPoolConfigs;
}
