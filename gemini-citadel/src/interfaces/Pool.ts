export interface Pool {
  address: string;
  dex: 'UniswapV3' | 'Sushiswap'; // Example DEXs
  token0: {
    address: string;
    symbol: string;
  };
  token1: {
    address: string;
    symbol: string;
  };
  reserve0: bigint;
  reserve1: bigint;
}