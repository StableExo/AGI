import { AppController } from './AppController';

const main = async () => {
  console.log('--- Starting Gemini Citadel Off-Chain Brain ---');
  try {
    const app = new AppController();
    await app.start();
    console.log('--- System Initialized Successfully ---');
  } catch (error) {
    // The error is already logged by the controller, so we just exit.
    process.exit(1);
  }
};

main();