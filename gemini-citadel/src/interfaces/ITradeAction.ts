import { BigNumberish } from 'ethers';

export interface ISwapStep {
  dexType: number;
  tokenIn: string;
  tokenOut: string;
  minAmountOut: BigNumberish;
  poolOrRouter: string;
  poolFee: number;
}

export interface ITradeAction {
  action: 'Buy' | 'Sell';
  exchange: string;
  pair: string;
  price: number;
  amount: number;
}