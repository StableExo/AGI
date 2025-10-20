// src/services/UniswapLegacyService.ts

import { JsonRpcProvider as ProviderV5 } from 'ethers-v5';
import { AlphaRouter } from '@uniswap/v3-sdk';
import { ChainId } from '@uniswap/sdk-core';

/**
 * @notice UniswapLegacyService is the ONLY module in the system that is permitted to
 * import and utilize the ethers-v5 alias and the @uniswap/v3-sdk. It serves as an
 * isolation layer to contain the technical debt of these legacy dependencies.
 */
export class UniswapLegacyService {
  private readonly providerV5: ProviderV5;
  private readonly router: AlphaRouter;

  constructor(rpcUrl: string, chainId: ChainId) {
    this.providerV5 = new ProviderV5(rpcUrl);
    this.router = new AlphaRouter({ chainId: chainId, provider: this.providerV5 });
  }

  // ... All Uniswap V3 logic will be moved here ...
}
