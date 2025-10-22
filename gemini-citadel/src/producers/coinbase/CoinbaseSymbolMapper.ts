export class CoinbaseSymbolMapper {
  private static readonly COINBASE_TO_STANDARD: Map<string, string> = new Map([
    ['BTC-USD', 'BTC/USD'],
    ['ETH-USD', 'ETH/USD'],
    ['BTC-USDT', 'BTC/USDT'],
    ['ETH-USDT', 'ETH/USDT']
  ]);

  static normalize(coinbaseSymbol: string): string {
    return this.COINBASE_TO_STANDARD.get(coinbaseSymbol) || coinbaseSymbol.replace('-', '/');
  }

  static denormalize(standardSymbol: string): string {
    return standardSymbol.replace('/', '-');
  }
}
