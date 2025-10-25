import pkg from "hardhat";
const { ethers } = pkg;
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Counter", function () {
  async function deployCounterFixture() {
    const Counter = await ethers.getContractFactory("Counter");
    const counter = await Counter.deploy();
    return { counter };
  }

  it("Should increment the counter", async function () {
    const { counter } = await loadFixture(deployCounterFixture);
    await counter.inc();
    expect(await counter.x()).to.equal(1);
  });

  it("Should increment the counter by a given value", async function () {
    const { counter } = await loadFixture(deployCounterFixture);
    await counter.incBy(10);
    expect(await counter.x()).to.equal(10);
  });
});
