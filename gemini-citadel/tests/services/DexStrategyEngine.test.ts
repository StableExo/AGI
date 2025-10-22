import { DexStrategyEngine } from '../../src/services/DexStrategyEngine';
import { ExchangeDataProvider } from '../../src/services/ExchangeDataProvider';
import { ArbitrageOpportunity } from '../../src/models/ArbitrageOpportunity';
import { ICexFetcher } from '../../src/interfaces/ICexFetcher';
import { IFetcher } from '../../src/interfaces/IFetcher';

class MockCexFetcher implements ICexFetcher {
  exchangeId: string;

  constructor(exchangeId: string, private price: number) {
    this.exchangeId = exchangeId;
  }
  async getTicker(pair: any): Promise<{ price: number; volume: number }> {
    return { price: this.price, volume: 1000 };
  }
  async getOrderBook(pair: any): Promise<{ bids: any[]; asks: any[] }> {
    return { bids: [], asks: [] };
  }
}

class MockDexFetcher implements IFetcher {
  constructor(private price: number) {}
  async fetchPrice(pair: string): Promise<number> {
    return this.price;
  }
  async fetchOrderBook(pair: string): Promise<any> {
    return { bids: [], asks: [] };
  }
}

describe('DexStrategyEngine', () => {
  let dexStrategyEngine: DexStrategyEngine;
  let dataProvider: ExchangeDataProvider;

  beforeEach(() => {
    dataProvider = new ExchangeDataProvider([]);
    dexStrategyEngine = new DexStrategyEngine(dataProvider);
  });

  it('should identify a profitable CEX-to-DEX arbitrage opportunity', async () => {
    const cexFetcher = new MockCexFetcher('btcc', 100);
    const dexFetcher = new MockDexFetcher(105);
    const cexFetchers = new Map([['btcc', cexFetcher]]);
    const dexFetchers = new Map([['uniswap', dexFetcher]]);

    jest.spyOn(dataProvider, 'getAllCexFetchers').mockReturnValue(cexFetchers);
    jest.spyOn(dataProvider, 'getAllFetchers').mockReturnValue(dexFetchers);
    jest.spyOn(dataProvider, 'getCexFee').mockReturnValue(0.001);
    jest.spyOn(dataProvider, 'getFee').mockReturnValue(0.003);

    const pairs = [{ base: 'WETH', quote: 'USDT' }];
    const opportunities = await dexStrategyEngine.findOpportunities(pairs);

    expect(opportunities).toHaveLength(1);
    const opportunity = opportunities[0];
    expect(opportunity).toBeInstanceOf(ArbitrageOpportunity);
    // Profit = (105 * (1 - 0.003)) - (100 * (1 + 0.001)) = 104.685 - 100.1 = 4.585
    const expectedProfit = (105 * (1 - 0.003)) - (100 * (1 + 0.001));
    const expectedProfitBigInt = BigInt(Math.trunc(expectedProfit * 1e18));
    expect(opportunity.profit).toBe(expectedProfitBigInt);
    expect(opportunity.tradeActions[0].action).toBe('BUY');
    expect(opportunity.tradeActions[0].exchange).toBe('btcc');
    expect(opportunity.tradeActions[1].action).toBe('SELL');
    expect(opportunity.tradeActions[1].exchange).toBe('uniswap');
  });
});
