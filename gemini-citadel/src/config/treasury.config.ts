// treasury.config.ts
// Single source of truth for Guardian Protocol's asset and exchange configurations.

// Describes the on-chain properties of a supported asset.
interface IAssetConfig {
  readonly contractAddress: string;
  readonly decimals: number;
}

// Maps a CEX to its specific deposit address for a given asset.
interface IExchangeDepositAddressMap {
  readonly [cexName: string]: {
    readonly [assetSymbol: string]: string;
  };
}

// --- CONFIGURATION ---

// Mainnet ERC20 token addresses.
export const ASSET_CONFIG: { readonly [assetSymbol: string]: IAssetConfig } = {
  USDC: {
    contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
  },
  USDT: {
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
  },
  // Additional assets can be added here.
};

// Known CEX deposit addresses.
// IMPORTANT: These are illustrative placeholders and must be replaced with
// real, verified deposit addresses for a live environment.
export const EXCHANGE_DEPOSIT_ADDRESSES: IExchangeDepositAddressMap = {
  Binance: {
    USDC: '0x..PlaceholderBinanceUsdcDepositAddress',
  },
  Coinbase: {
    USDC: '0x..PlaceholderCoinbaseUsdcDepositAddress',
  },
  // Additional exchanges and their deposit addresses can be added here.
};

export const treasuryConfig = {
  assets: ASSET_CONFIG,
  exchanges: EXCHANGE_DEPOSIT_ADDRESSES,
};
