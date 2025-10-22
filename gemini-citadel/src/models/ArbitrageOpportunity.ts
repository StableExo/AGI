import { ITradeAction } from './ITradeAction';

export class ArbitrageOpportunity {
  public profitable: boolean;
  public profit: bigint;
  public tradeActions: ITradeAction[];

  constructor(profit: bigint, tradeActions: ITradeAction[]) {
    this.profitable = profit > 0;
    this.profit = profit;
    this.tradeActions = tradeActions;
  }
}