import { StrategyEngine } from './strategy.service';

describe('StrategyEngine', () => {
  it('should instantiate correctly', () => {
    const engine = new StrategyEngine();
    expect(engine).toBeInstanceOf(StrategyEngine);
  });
});