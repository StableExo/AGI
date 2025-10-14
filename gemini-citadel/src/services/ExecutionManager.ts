import { IOrderBuilder } from '../interfaces/IOrderBuilder';
import { ITradeOpportunity } from '../interfaces/ITradeOpportunity';

export class ExecutionManager {
  private builders: Map<string, IOrderBuilder> = new Map();

  constructor(builderInstances: { name: string; instance: IOrderBuilder }[]) {
    builderInstances.forEach(builder => {
      this.registerBuilder(builder.name, builder.instance);
    });
  }

  /**
   * Registers a new order builder with the execution manager.
   * @param name - The name of the exchange protocol (e.g., 'btcc').
   * @param builder - The order builder instance.
   */
  public registerBuilder(name: string, builder: IOrderBuilder): void {
    this.builders.set(name, builder);
    console.log(`[ExecutionManager] Registered order builder: ${name}`);
  }

  /**
   * Executes a trade opportunity by invoking the required order builders.
   * It ensures each builder is called only once per opportunity, even if multiple
   * actions belong to the same exchange protocol.
   * @param opportunity - The trade opportunity to execute.
   */
  public async execute(opportunity: ITradeOpportunity): Promise<void> {
    // Identify the unique set of exchange protocols involved in the opportunity.
    const requiredProtocols = [...new Set(opportunity.actions.map(action => action.exchange))];

    for (const protocol of requiredProtocols) {
      const builder = this.builders.get(protocol);
      if (builder) {
        // The builder is responsible for handling the entire opportunity context.
        const result = await builder.buildOrder(opportunity);
        // In this "Log-Only" phase, the result is the formatted log message.
        console.log(result);
      } else {
        // We log a warning if a builder is missing, but this is not a fatal error
        // for the entire opportunity, as other parts might still be loggable.
        console.warn(`[ExecutionManager] No order builder found for exchange protocol: "${protocol}". Cannot log or execute this part of the opportunity.`);
      }
    }
  }
}