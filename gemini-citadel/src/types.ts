// gemini-citadel/src/types.ts
export interface Token {
  address: string;
  symbol: string;
  decimals: number;
}

export interface Pool {
  address: string;
  tokenA: Token;
  tokenB: Token;
  price: number; // Price of tokenA in terms of tokenB
}

export interface Opportunity {
  buyPool: Pool;
  sellPool: Pool;
  profitMargin: number;
}