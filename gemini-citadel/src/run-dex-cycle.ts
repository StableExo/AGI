// gemini-citadel/src/run-dex-cycle.ts
import 'dotenv/config';
import { AppFactory } from './AppFactory';
import * as assert from 'assert';

async function main() {
  let logOutput = '';
  const originalLog = console.log;
  console.log = (message: string) => {
    logOutput += message;
  };

  try {
    const appController = await AppFactory.create();
    await appController.runDexCycle();
  } catch (error) {
    console.error('An error occurred during the DEX cycle execution:', error);
    process.exit(1);
  } finally {
    console.log = originalLog;
  }

  // --- Final Validation ---
  try {
    assert.ok(logOutput.includes('[ArbitrageEngine] Arbitrage cycle completed successfully.'), 'The arbitrage cycle did not complete successfully.');
    console.log('✅ End-to-End Validation Successful: The arbitrage engine completed its cycle.');
  } catch (error) {
    console.error('❌ End-to-End Validation Failed:', error);
    process.exit(1);
  }
}

main();
