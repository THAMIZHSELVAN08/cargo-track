const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IronFistLogger", function () {
  let contract, owner, otherAccount;

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("IronFistLogger");
    contract = await Factory.deploy();
  });

  it("should deploy with correct owner", async function () {
    expect(await contract.owner()).to.equal(owner.address);
  });

  it("should log an event and emit EventLogged", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("test-event-data"));
    await expect(contract.logEvent(hash, "LOGIN_SUCCESS"))
      .to.emit(contract, "EventLogged")
      .withArgs(0, hash, "LOGIN_SUCCESS", await ethers.provider.getBlock("latest").then(b => b.timestamp + 1), owner.address);
  });

  it("should reject duplicate hashes", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("duplicate"));
    await contract.logEvent(hash, "GPS_UPDATE");
    await expect(contract.logEvent(hash, "GPS_UPDATE")).to.be.revertedWith(
      "IronFist: duplicate hash already logged"
    );
  });

  it("should reject zero hash", async function () {
    const zeroHash = ethers.ZeroHash;
    await expect(contract.logEvent(zeroHash, "TEST")).to.be.revertedWith(
      "IronFist: hash cannot be zero"
    );
  });

  it("should reject non-owner submissions", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("unauthorized"));
    await expect(
      contract.connect(otherAccount).logEvent(hash, "TEST")
    ).to.be.revertedWith("IronFist: caller is not the owner");
  });

  it("should retrieve logs correctly", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("get-log-test"));
    await contract.logEvent(hash, "UNLOCK_APPROVED");
    const [retrievedHash, eventType, , submitter] = await contract.getLog(0);
    expect(retrievedHash).to.equal(hash);
    expect(eventType).to.equal("UNLOCK_APPROVED");
    expect(submitter).to.equal(owner.address);
  });

  it("should verify hash existence", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("verify-test"));
    expect(await contract.verifyHash(hash)).to.be.false;
    await contract.logEvent(hash, "ENGINE_IMMOBILIZED");
    expect(await contract.verifyHash(hash)).to.be.true;
  });

  it("should return correct log count", async function () {
    expect(await contract.getLogCount()).to.equal(0);
    for (let i = 0; i < 3; i++) {
      const hash = ethers.keccak256(ethers.toUtf8Bytes(`event-${i}`));
      await contract.logEvent(hash, "SYSTEM_EVENT");
    }
    expect(await contract.getLogCount()).to.equal(3);
  });
});
