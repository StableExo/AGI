import { ethers } from "hardhat";
import "dotenv/config";
import { FlashSwap } from "../typechain-types";
import { Contract, Wallet } from "ethers";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Testing contract with the account:", deployer.address);

  const flashSwapAddress = process.env.FLASH_SWAP_CONTRACT_ADDRESS;
  if (!flashSwapAddress) {
    throw new Error("FLASH_SWAP_CONTRACT_ADDRESS not set in environment variables. Please deploy the contract first.");
  }

  console.log(`Attaching to deployed FlashSwap contract at: ${flashSwapAddress}`);
  const flashSwap: FlashSwap = await ethers.getContractAt("FlashSwap", flashSwapAddress);

  // Base Network Addresses
  const wethAddress = "0x4200000000000000000000000000000000000006";
  const loanAmount = ethers.parseUnits("0.001", 18); // Borrow 0.001 WETH

  // To successfully repay the flash loan, the contract needs enough funds to cover the premium.
  // For this test, we will pre-fund the contract with a small amount of WETH.
  console.log("Funding contract with WETH to cover flash loan premium...");
  const wethAbi = ["function transfer(address to, uint256 value) public returns (bool)"];
  const wethContract = new Contract(wethAddress, wethAbi, deployer);

  const premiumAmount = loanAmount * BigInt(5) / BigInt(10000); // Aave V3 fee is 0.05%
  const fundingTx = await wethContract.transfer(flashSwapAddress, premiumAmount);
  await fundingTx.wait();
  console.log(`Funded contract with ${ethers.formatUnits(premiumAmount, 18)} WETH.`);


  // Prepare the `ArbParams` for the flash loan.
  // For this integration test, we use empty commands and inputs, as we are only
  // testing the flash loan mechanism itself, not a real arbitrage.
  const arbParams = {
    initiator: deployer.address,
    titheRecipient: deployer.address,
    titheBps: 0,
    isGasEstimation: false,
    commands: "0x",
    inputs: [],
  };

  // ABI-encode the params
  const encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(
    ["tuple(address initiator, address titheRecipient, uint256 titheBps, bool isGasEstimation, bytes commands, bytes[] inputs)"],
    [arbParams]
  );

  console.log("Initiating Aave flash loan...");
  const tx = await flashSwap.initiateAaveFlashLoan(wethAddress, loanAmount, encodedParams);

  console.log("Flash loan transaction sent:", tx.hash);
  const receipt = await tx.wait();

  if (receipt && receipt.status === 1) {
    console.log("✅ Flash loan executed successfully!");
    console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
  } else {
    console.error("❌ Flash loan transaction failed.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
