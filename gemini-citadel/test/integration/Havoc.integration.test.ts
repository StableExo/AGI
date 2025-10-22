// gemini-citadel/test/integration/Havoc.integration.test.ts
import 'dotenv/config';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { AppController } from '../../src/AppController';
import { AppFactory } from '../../src/AppFactory';
import { botConfig } from '../../src/config/bot.config';
import { JsonRpcProvider } from 'ethers';

describe('Havoc Integration Test', () => {
  let appController: AppController;

  before(async () => {
    // This will use the Hardhat network configured to fork Base mainnet
    const provider = new JsonRpcProvider(process.env.RPC_URL);
    botConfig.loopIntervalMs = 60 * 1000; // Set a longer interval for testing

    // We need to create a real instance of the AppController, connected to the forked network
    // The AppFactory will handle all the complex initialization for us.
    appController = await AppFactory.create();
  });

  it('should successfully fetch live pool data from a forked Base mainnet', async () => {
    // We will call the runDexCycle method, which now contains our integrated UniswapV3Fetcher
    // This will attempt to fetch data for the WETH/USDC pool on the forked network.
    // We will capture the log output to verify the result.

    let logOutput = '';
    const originalLog = console.log;
    console.log = (message: string) => {
      logOutput += message;
    };

    await appController.runDexCycle();

    console.log = originalLog; // Restore the original console.log

    // Assert that the log output contains the success message and valid data
    expect(logOutput).to.include('[AppController] Successfully fetched data for pool');
    expect(logOutput).to.include('Liquidity:');
    expect(logOutput).to.include('SqrtPriceX96:');
    expect(logOutput).to.include('Tick:');
  }).timeout(60000); // Increase timeout to 60 seconds to allow for forking and fetching
});
