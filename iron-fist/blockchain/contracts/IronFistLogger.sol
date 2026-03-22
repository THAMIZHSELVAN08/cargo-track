// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IronFistLogger
 * @notice Tamper-proof event log for the Iron Fist cargo security platform.
 * @dev Stores SHA-256 hashes of event data (NOT raw data for privacy).
 *      Raw data lives in MongoDB; this contract provides immutable proof
 *      that the data existed and was unmodified at a specific block timestamp.
 *
 * Security Properties:
 * - Only the contract owner (deployer) can submit logs
 * - Logs are append-only (cannot be modified or deleted)
 * - Each log is indexed and retrievable
 * - Events are emitted for off-chain indexing
 */
contract IronFistLogger {
    // ── State Variables ────────────────────────────────────────────────────────

    address public owner;

    struct LogEntry {
        bytes32 dataHash;      // SHA-256 hash of the full event data
        string  eventType;     // e.g. "LOGIN_SUCCESS", "UNLOCK_APPROVED"
        uint256 timestamp;     // Block timestamp (seconds since Unix epoch)
        address submitter;     // Address that submitted this log
    }

    LogEntry[] private logs;

    // Mapping from dataHash → log index for deduplication checks
    mapping(bytes32 => bool) public hashExists;

    // ── Events ─────────────────────────────────────────────────────────────────

    event EventLogged(
        uint256 indexed index,
        bytes32 indexed dataHash,
        string  eventType,
        uint256 timestamp,
        address submitter
    );

    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    // ── Modifiers ──────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "IronFist: caller is not the owner");
        _;
    }

    modifier nonZeroHash(bytes32 hash) {
        require(hash != bytes32(0), "IronFist: hash cannot be zero");
        _;
    }

    // ── Constructor ────────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ── Write Functions ────────────────────────────────────────────────────────

    /**
     * @notice Submit a new event log hash to the blockchain
     * @param dataHash The SHA-256 hash of the full event data (bytes32)
     * @param eventType Human-readable event category
     * @return index The index of the newly created log entry
     */
    function logEvent(bytes32 dataHash, string calldata eventType)
        external
        onlyOwner
        nonZeroHash(dataHash)
        returns (uint256 index)
    {
        // Prevent duplicate hash submissions
        require(!hashExists[dataHash], "IronFist: duplicate hash already logged");

        index = logs.length;
        logs.push(LogEntry({
            dataHash:  dataHash,
            eventType: eventType,
            timestamp: block.timestamp,
            submitter: msg.sender
        }));

        hashExists[dataHash] = true;

        emit EventLogged(index, dataHash, eventType, block.timestamp, msg.sender);
    }

    // ── Read Functions ─────────────────────────────────────────────────────────

    /**
     * @notice Retrieve a specific log entry by index
     * @param index Log index (0-based)
     */
    function getLog(uint256 index)
        external
        view
        returns (
            bytes32 dataHash,
            string memory eventType,
            uint256 timestamp,
            address submitter
        )
    {
        require(index < logs.length, "IronFist: index out of bounds");
        LogEntry storage entry = logs[index];
        return (entry.dataHash, entry.eventType, entry.timestamp, entry.submitter);
    }

    /**
     * @notice Get total number of logs stored
     */
    function getLogCount() external view returns (uint256) {
        return logs.length;
    }

    /**
     * @notice Verify if a specific hash has been logged
     * @param dataHash The hash to verify
     * @return exists True if the hash is on-chain
     */
    function verifyHash(bytes32 dataHash) external view returns (bool exists) {
        return hashExists[dataHash];
    }

    /**
     * @notice Get recent logs (last N entries)
     * @param n Number of recent entries to retrieve
     */
    function getRecentLogs(uint256 n)
        external
        view
        returns (LogEntry[] memory)
    {
        uint256 total = logs.length;
        uint256 count = n > total ? total : n;
        LogEntry[] memory result = new LogEntry[](count);

        for (uint256 i = 0; i < count; i++) {
            result[i] = logs[total - count + i];
        }
        return result;
    }

    // ── Admin Functions ────────────────────────────────────────────────────────

    /**
     * @notice Transfer ownership of the contract
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "IronFist: new owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
