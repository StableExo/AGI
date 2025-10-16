import { ITradeAction } from './ITradeAction';

export class ArbitrageOpportunity {
  public profitable: boolean;
  public profit: number;
  public tradeActions: ITradeAction[];

  constructor(profit: number, tradeActions: ITradeAction[]) {
    this.profitable = profit > 0;
    this.profit = profit;
    this.tradeActions = tradeActions;
  }
}