import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

describe("FlashSwap", function () {
  it("Should deploy the contract", async function () {
    const [deployer]: Signer[] = await ethers.getSigners();

    const universalRouter = "0x0000000000000000000000000000000000000001";
    const uniswapV3Factory = "0x0000000000000000000000000000000000000002";
    const wethAddress = "0x0000000000000000000000000000000000000003";
    const initialOwner = await deployer.getAddress();

    // Deploy Mocks
    const MockPool = await ethers.getContractFactory("MockPool");
    const mockPool = await MockPool.deploy("0x0000000000000000000000000000000000000005");
    await mockPool.waitForDeployment();
    const mockPoolAddress = await mockPool.getAddress();

    const MockPoolAddressesProvider = await ethers.getContractFactory("MockPoolAddressesProvider");
    const mockPoolAddressesProvider = await MockPoolAddressesProvider.deploy(mockPoolAddress);
    await mockPoolAddressesProvider.waitForDeployment();
    const mockPoolAddressesProviderAddress = await mockPoolAddressesProvider.getAddress();

    const FlashSwap = await ethers.getContractFactory("FlashSwap");
    const flashSwap = await FlashSwap.deploy(
      universalRouter,
      uniswapV3Factory,
      wethAddress,
      initialOwner,
      mockPoolAddressesProviderAddress
    );
    await flashSwap.waitForDeployment();
    expect(await flashSwap.getAddress()).to.not.be.null;
  });

  it("Should be able to initiate a flash loan", async function () {
    const [deployer]: Signer[] = await ethers.getSigners();

    const universalRouter = "0x0000000000000000000000000000000000000001";
    const uniswapV3Factory = "0x0000000000000000000000000000000000000002";
    const wethAddress = "0x0000000000000000000000000000000000000003";
    const initialOwner = await deployer.getAddress();

    // Deploy Mocks
    const MockPool = await ethers.getContractFactory("MockPool");
    const mockPool = await MockPool.deploy("0x0000000000000000000000000000000000000005");
    await mockPool.waitForDeployment();
    const mockPoolAddress = await mockPool.getAddress();

    const MockPoolAddressesProvider = await ethers.getContractFactory("MockPoolAddressesProvider");
    const mockPoolAddressesProvider = await MockPoolAddressesProvider.deploy(mockPoolAddress);
    await mockPoolAddressesProvider.waitForDeployment();
    const mockPoolAddressesProviderAddress = await mockPoolAddressesProvider.getAddress();

    const FlashSwap = await ethers.getContractFactory("FlashSwap");
    const flashSwap = await FlashSwap.deploy(
      universalRouter,
      uniswapV3Factory,
      wethAddress,
      initialOwner,
      mockPoolAddressesProviderAddress
    );
    await flashSwap.waitForDeployment();

    // We can't fully test the flash loan in this mock environment,
    // but we can ensure the function is callable.
    await expect(
      flashSwap.initiateAaveFlashLoan(
        [], [], [], "0x", 0
      )
    ).to.not.be.reverted;
  });
});
