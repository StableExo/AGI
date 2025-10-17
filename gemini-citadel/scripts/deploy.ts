import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const _uniswapV3Router = "0x2626664c2603336E57B271c5C0b26F421741e481";
  const _aavePool = "0x0000000000000000000000000000000000000000";
  const _uniswapV3Factory = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";
  const _wethAddress = "0x4200000000000000000000000000000000000006";
  const _initialOwner = deployer.address;

  const flashSwapFactory = await ethers.getContractFactory("FlashSwap");
  const flashSwap = await flashSwapFactory.deploy(
    _uniswapV3Router,
    _aavePool,
    _uniswapV3Factory,
    _wethAddress,
    _initialOwner
  );

  await flashSwap.waitForDeployment();

  const flashSwapAddress = await flashSwap.getAddress()

  console.log(`Deployed FlashSwap to: ${flashSwapAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});