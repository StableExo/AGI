import { AppFactory } from './AppFactory';
import logger from './services/logger.service';

const main = async () => {
  logger.info('--- Starting Gemini Citadel Off-Chain Brain ---');
  try {
    const app = await AppFactory.create();
    await app.start(); // This will now run indefinitely
  } catch (error) {
    logger.error('--- A fatal error occurred during initialization ---', error)
    process.exit(1);
  }
};

main();