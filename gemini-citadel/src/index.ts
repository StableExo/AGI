import { AppController } from './AppController';

const main = async () => {
  console.log('--- Starting Gemini Citadel Off-Chain Brain ---');
  try {
    const app = new AppController();
    await app.start(); // This will now run indefinitely
  } catch (error) {
    console.error('--- A fatal error occurred during initialization ---', error)
    process.exit(1);
  }
};

main();