import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const _universalRouter = "0x2626664c2603336E57B271c5C0b26F421741e481"; // Uniswap Universal Router on Base
  const _uniswapV3Factory = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD"; // Uniswap V3 Factory on Base
  const _wethAddress = "0x4200000000000000000000000000000000000006"; // WETH on Base
  const _initialOwner = deployer.address;
  const _aaveAddressProvider = process.env.AAVE_BASE_ADDRESS_PROVIDER;

  if (!_aaveAddressProvider) {
    throw new Error("AAVE_BASE_ADDRESS_PROVIDER not set in environment variables.");
  }
  console.log(`Using Aave Address Provider: ${_aaveAddressProvider}`);

  const flashSwapFactory = await ethers.getContractFactory("FlashSwap");
  const flashSwap = await flashSwapFactory.deploy(
    _universalRouter,
    _uniswapV3Factory,
    _wethAddress,
    _initialOwner,
    _aaveAddressProvider
  );

  // In ethers v6, the deploy method waits for the transaction to be mined
  // and the address is available on the 'target' property.
  const flashSwapAddress = flashSwap.target;

  console.log(`Deployed FlashSwap to: ${flashSwapAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
