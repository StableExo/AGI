import { expect } from "chai";
import hre from "hardhat";

describe("FlashSwap", function () {
  let flashSwap: any;

  beforeEach(async function () {
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();

    const universalRouter = "0x0000000000000000000000000000000000000001";
    const uniswapV3Factory = "0x0000000000000000000000000000000000000002";
    const wethAddress = "0x0000000000000000000000000000000000000003";
    const initialOwner = deployer.address;

    // Deploy Mocks
    const MockPoolFactory = await ethers.getContractFactory("MockPool");
    const mockPool = await MockPoolFactory.deploy("0x0000000000000000000000000000000000000005");
    const mockPoolAddress = mockPool.target;

    const MockPoolAddressesProviderFactory = await ethers.getContractFactory("MockPoolAddressesProvider");
    const mockPoolAddressesProvider = await MockPoolAddressesProviderFactory.deploy(mockPoolAddress);
    const mockPoolAddressesProviderAddress = mockPoolAddressesProvider.target;

    const FlashSwapFactory = await ethers.getContractFactory("FlashSwap");
    flashSwap = await FlashSwapFactory.deploy(
      universalRouter,
      uniswapV3Factory,
      wethAddress,
      initialOwner,
      mockPoolAddressesProviderAddress
    );
  });

  it("Should deploy the contract", async function () {
    expect(flashSwap.target).to.not.be.null;
  });

  it("Should be able to initiate a flash loan", async function () {
    // We can't fully test the flash loan in this mock environment,
    // but we can ensure the function is callable.
    await expect(
      flashSwap.initiateAaveFlashLoan(
        [], [], [], "0x", 0
      )
    ).to.not.be.reverted;
  });
});
