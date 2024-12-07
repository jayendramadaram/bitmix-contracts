import { ethers } from "hardhat";
import { MockERC20 } from "../typechain-types";
import hre from "hardhat";

async function main() {
  // const [deployer] = await ethers.getSigners();
  // console.log("Deploying contracts with account:", deployer.address);

  // const MockERC20Factory = await ethers.getContractFactory("MockERC20");
  // const mockWBTC = await MockERC20Factory.deploy(
  //   "Wrapped Bitcoin", 
  //   "MWBTC", 
  // ) as MockERC20;
  // await mockWBTC.waitForDeployment();
  // const wbtcAddress = await mockWBTC.getAddress();

  // const MockProverFactory = await ethers.getContractFactory("MockProverContract");
  // const mockProver = await MockProverFactory.deploy();
  // await mockProver.waitForDeployment();
  // const proverAddress = await mockProver.getAddress();

  // const MockLightClientFactory = await ethers.getContractFactory("MockLightClient");
  // const mockLightClient = await MockLightClientFactory.deploy();
  // await mockLightClient.waitForDeployment();
  // const lightClientAddress = await mockLightClient.getAddress();

  // const BitMixFactory = await ethers.getContractFactory("BitMix");
  // const bitMix = await BitMixFactory.deploy(
  //   wbtcAddress, 
  //   proverAddress, 
  //   lightClientAddress
  // );
  // await bitMix.waitForDeployment();
  // const bitMixAddress = await bitMix.getAddress();

  // console.log("MockERC20 deployed to:", wbtcAddress);
  // console.log("MockProverContract deployed to:", proverAddress);
  // console.log("MockLightClient deployed to:", lightClientAddress);
  // console.log("BitMix deployed to:", bitMixAddress);

  await hre.run("verify:verify", {
    address: "0xA34702f92A3b7b1C2aCC78579B2a7fc96bFC5d7d",
    // contract: "contracts/root.sol:BitMix",
    constructorArguments: ["0x6C68161cc52409D59d24E09E7C65F6bD5374CdF3", "0xe14e73C96E4BEf4863B25faFA37566e30fB8A652", "0x7eBDA8827F645cAa68fd060Dfe2351d4080d6171"]
  });

  // sleep
  await new Promise((resolve) => setTimeout(resolve, 10000));

  await hre.run("verify:verify", {
    address: "0x6C68161cc52409D59d24E09E7C65F6bD5374CdF3",
    constructorArguments: ["Wrapped Bitcoin", "MWBTC"]
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
