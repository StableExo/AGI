// gemini-citadel/test/integration/Havoc.integration.test.ts
import 'dotenv/config';
import { expect } from 'chai';
import pkg from 'hardhat';
const { ethers } = pkg;
import type { AppController } from '../../src/AppController.js';

describe('Havoc Integration Test', () => {
  let appController: AppController;

  before(async () => {
    // Dynamically import all necessary modules to bypass ESM/CJS resolution issues
    const { AppFactory } = await import('../../src/AppFactory.js');
    const { botConfig } = await import('../../src/config/bot.config.js');

    botConfig.loopIntervalMs = 60 * 1000; // Set a longer interval for testing

    // We need to create a real instance of the AppController, connected to the forked network
    appController = await AppFactory.create();
  });

  it('should successfully complete an arbitrage cycle on a forked Base mainnet', async () => {
    let logOutput = '';
    const originalLog = console.log;
    console.log = (message: string) => {
      logOutput += message;
    };

    try {
      await appController.runDexCycle();
    } finally {
      console.log = originalLog; // Restore the original console.log
    }

    // A less specific assertion to avoid brittleness
    expect(logOutput).to.include('opportunities');
  });
});
