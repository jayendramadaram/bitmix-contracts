import { expect } from "chai";
import { ethers } from "hardhat";
import { 
  BitMix, 
  MockERC20,
  MockERC20__factory,
  MockProverContract__factory,
  MockLightClient__factory,
  MockProverContract,
  MockLightClient,
  BitMix__factory
} from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("BitMix", () => {
  let bitMix: BitMix;
  let mockWBTC: MockERC20;
  let mockProver: MockProverContract;
  let mockLightClient: MockLightClient;
  
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();

    const MockERC20Factory = new MockERC20__factory(owner);
    mockWBTC = await MockERC20Factory.deploy("Wrapped Bitcoin", "WBTC");

    const MockProverFactory = new MockProverContract__factory(owner);
    mockProver = await MockProverFactory.deploy();

    const MockLightClientFactory = new MockLightClient__factory(owner);
    mockLightClient = await MockLightClientFactory.deploy();

    const BitMixFactory = new BitMix__factory(owner);
    bitMix = await BitMixFactory.deploy(
      await mockWBTC.getAddress(),
      await mockProver.getAddress(),
      await mockLightClient.getAddress()
    );

    await mockWBTC.mint(alice.address, ethers.parseEther("100"));
  });

  describe("Deposit", () => {
    it("Should create order successfully", async () => {
      await mockWBTC.connect(alice).approve(await bitMix.getAddress(), ethers.parseEther("10"));

      const amount = ethers.parseEther("5");
      const pubkey = ethers.keccak256(ethers.toUtf8Bytes("test_pubkey"));

      const initialNonce = await bitMix.nonces(alice.address);

      const expectedOrderID = ethers.keccak256(
        ethers.solidityPacked(
          ["address", "uint256", "bytes32", "uint256"],
          [alice.address, amount, pubkey, initialNonce]
        )
      );

      const tx = await bitMix.connect(alice).deposit(amount, pubkey);
      await tx.wait();

      const orderDetails = await bitMix.orderMap(expectedOrderID);
      expect(orderDetails.amount).to.equal(amount);
      expect(orderDetails.pubkey).to.equal(pubkey);
      expect(orderDetails.isValidated).to.be.false;
    });

    it("Should revert if insufficient allowance", async () => {
      const amount = ethers.parseEther("5");
      const pubkey = ethers.keccak256(ethers.toUtf8Bytes("test_pubkey"));

      await expect(
        bitMix.connect(alice).deposit(amount, pubkey)
      ).to.be.reverted;
    });
  });

  describe("Validate", () => {
    let orderID: string;
    
    beforeEach(async () => {
      await mockWBTC.connect(alice).approve(await bitMix.getAddress(), ethers.parseEther("10"));
      
      const amount = ethers.parseEther("5");
      const pubkey = ethers.keccak256(ethers.toUtf8Bytes("test_pubkey"));

      const tx = await bitMix.connect(alice).deposit(amount, pubkey);
      await tx.wait();

      const initialNonce = await bitMix.nonces(alice.address);
      orderID = ethers.keccak256(
        ethers.solidityPacked(
          ["address", "uint256", "bytes32", "uint256"],
          [alice.address, amount, pubkey, initialNonce - 1n]
        )
      );
    });

    it("Should validate order successfully", async () => {
      const proof = ethers.toUtf8Bytes("test_proof");
      const inputs = ethers.toUtf8Bytes("test_inputs");
      const blockhash = ethers.keccak256(proof);

      // await mockLightClient.addValidBlockhash(blockhash);

      const tx = await bitMix.connect(alice).validate(orderID, proof, inputs);
      await tx.wait();

      const orderDetails = await bitMix.orderMap(orderID);
      expect(orderDetails.isValidated).to.be.true;
    });

    it("Should revert validation for already validated order", async () => {
      const proof = ethers.toUtf8Bytes("test_proof");
      const inputs = ethers.toUtf8Bytes("test_inputs");
      const blockhash = ethers.keccak256(proof);

      // await mockLightClient.addValidBlockhash(blockhash);

      await bitMix.connect(alice).validate(orderID, proof, inputs);

      await expect(
        bitMix.connect(alice).validate(orderID, proof, inputs)
      ).to.be.revertedWith("Order already validated");
    });
  });
});