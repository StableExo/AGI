// gemini-citadel/src/havoc-core/core/tx/ParameterBuilderFactory.ts
import { AavePathBuilder } from './builders/AavePathBuilder';
import { TriangularPathBuilder } from './builders/TriangularPathBuilder';
import { TwoHopV3PathBuilder } from './builders/TwoHopV3PathBuilder';
import logger from '../../../../services/logger.service';

const logPrefix = '[ParameterBuilderFactory]';

export class ParameterBuilderFactory {
  private readonly aavePathBuilder: AavePathBuilder;
  private readonly triangularPathBuilder: TriangularPathBuilder;
  private readonly twoHopV3PathBuilder: TwoHopV3PathBuilder;

  constructor() {
    this.aavePathBuilder = new AavePathBuilder();
    this.triangularPathBuilder = new TriangularPathBuilder();
    this.twoHopV3PathBuilder = new TwoHopV3PathBuilder();
    logger.debug(`${logPrefix} Initialized.`);
  }

  public getBuilder(opportunity: any): any {
    // Basic determination of builder based on opportunity properties
    // This logic can be expanded as more opportunity types are supported.
    if (opportunity.type === 'triangular') {
      logger.debug(`${logPrefix} Selected TriangularPathBuilder.`);
      return this.triangularPathBuilder;
    }

    if (opportunity.type === 'spatial' && opportunity.path?.[0]?.dex === 'uniswapV3' && opportunity.path?.[1]?.dex === 'uniswapV3') {
      logger.debug(`${logPrefix} Selected TwoHopV3PathBuilder.`);
      return this.twoHopV3PathBuilder;
    }

    // Default to AavePathBuilder for more complex or generic paths
    // This assumes that other multi-step paths will be executed via the general Aave flash loan function.
    if (opportunity.path && opportunity.path.length > 0) {
      logger.debug(`${logPrefix} Selected AavePathBuilder as the default for multi-step path.`);
      return this.aavePathBuilder;
    }

    logger.error(`${logPrefix} No suitable builder found for the provided opportunity.`, { opportunity });
    throw new Error('No suitable parameter builder found for the given opportunity type.');
  }
}
