/**
 * Blockchain Service
 * Connects to the Ethereum network (Hardhat local / mainnet)
 * and submits event log hashes to the IronFistLogger smart contract
 */

const { ethers } = require("ethers");
const logger = require("../utils/logger");

// ABI for the IronFistLogger smart contract (only the functions we call)
const CONTRACT_ABI = [
  "function logEvent(bytes32 dataHash, string eventType) external returns (uint256)",
  "function getLog(uint256 index) external view returns (bytes32 dataHash, string eventType, uint256 timestamp, address submitter)",
  "function getLogCount() external view returns (uint256)",
  "event EventLogged(uint256 indexed index, bytes32 dataHash, string eventType, uint256 timestamp)",
];

class BlockchainService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.signer = null;
    this.initialized = false;
  }

  /**
   * Initialize the Ethereum provider, wallet signer, and contract instance
   */
  async init() {
    try {
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
      const contractAddress = process.env.CONTRACT_ADDRESS;
      const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

      if (!contractAddress || !privateKey) {
        logger.warn("⚠️  Blockchain not configured — logging will be MongoDB-only");
        return;
      }

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.signer = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(contractAddress, CONTRACT_ABI, this.signer);

      // Confirm connection with a network ping
      const network = await this.provider.getNetwork();
      logger.info(`⛓️  Blockchain connected: chainId ${network.chainId}`);
      this.initialized = true;
    } catch (err) {
      logger.warn(`⚠️  Blockchain init failed: ${err.message}. Continuing without blockchain.`);
    }
  }

  /**
   * Submit a SHA-256 hash to the smart contract
   * @param {string} hexHash - 64-char hex hash (without 0x prefix)
   * @param {string} eventType - Human-readable event type label
   * @returns {string|null} Transaction hash, or null if unavailable
   */
  async logEvent(hexHash, eventType) {
    if (!this.initialized) {
      logger.warn("Blockchain not initialized — skipping on-chain log");
      return null;
    }

    try {
      // Convert hex string to bytes32 format expected by Solidity
      const bytes32Hash = "0x" + hexHash.padEnd(64, "0");

      const tx = await this.contract.logEvent(bytes32Hash, eventType);
      const receipt = await tx.wait(); // Wait for 1 confirmation

      logger.info(`⛓️  Blockchain TX: ${receipt.hash} (block ${receipt.blockNumber})`);
      return receipt.hash;
    } catch (err) {
      logger.error(`Blockchain log failed: ${err.message}`);
      return null; // Graceful degradation — don't fail the API call
    }
  }

  /**
   * Read a stored log from the blockchain
   * @param {number} index - Log index
   */
  async getLog(index) {
    if (!this.initialized) return null;
    try {
      const log = await this.contract.getLog(index);
      return {
        dataHash: log.dataHash,
        eventType: log.eventType,
        timestamp: new Date(Number(log.timestamp) * 1000).toISOString(),
        submitter: log.submitter,
      };
    } catch (err) {
      logger.error(`Failed to read blockchain log: ${err.message}`);
      return null;
    }
  }

  /**
   * Get total number of logs stored on-chain
   */
  async getLogCount() {
    if (!this.initialized) return 0;
    try {
      const count = await this.contract.getLogCount();
      return Number(count);
    } catch (err) {
      return 0;
    }
  }
}

// Export a singleton instance
const blockchainService = new BlockchainService();
module.exports = blockchainService;
