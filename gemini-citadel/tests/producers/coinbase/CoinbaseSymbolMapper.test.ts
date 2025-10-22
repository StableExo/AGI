import { CoinbaseSymbolMapper } from '../../../src/producers/coinbase/CoinbaseSymbolMapper';

describe('CoinbaseSymbolMapper', () => {
  it('should normalize BTC-USD to BTC/USD', () => {
    expect(CoinbaseSymbolMapper.normalize('BTC-USD')).toBe('BTC/USD');
  });

  it('should handle symbol with different base/quote', () => {
    expect(CoinbaseSymbolMapper.normalize('ETH-BTC')).toBe('ETH/BTC');
  });

  it('should denormalize BTC/USD to BTC-USD', () => {
    expect(CoinbaseSymbolMapper.denormalize('BTC/USD')).toBe('BTC-USD');
  });

  it('should handle denormalization for symbol with different base/quote', () => {
    expect(CoinbaseSymbolMapper.denormalize('ETH/BTC')).toBe('ETH-BTC');
  });

  it('should return the original string if no hyphen is present for normalization', () => {
    expect(CoinbaseSymbolMapper.normalize('BTCUSD')).toBe('BTCUSD');
  });

  it('should return the original string if no slash is present for denormalization', () => {
    expect(CoinbaseSymbolMapper.denormalize('BTCUSD')).toBe('BTCUSD');
  });
});
