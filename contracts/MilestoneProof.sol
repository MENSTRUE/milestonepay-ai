// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Optional, hash-only proof anchoring. NOT escrow, transfer, or settlement.
contract MilestoneProof {
    address public immutable owner;
    mapping(bytes32 => bool) public anchored;
    event ProofAnchored(bytes32 indexed requestHash, bytes32 indexed auditHash, address indexed submitter);

    constructor() { owner = msg.sender; }

    function anchor(bytes32 requestHash, bytes32 auditHash) external {
        require(msg.sender == owner, "owner only");
        require(requestHash != bytes32(0) && auditHash != bytes32(0), "empty hash");
        bytes32 record = keccak256(abi.encode(requestHash, auditHash));
        require(!anchored[record], "already anchored");
        anchored[record] = true;
        emit ProofAnchored(requestHash, auditHash, msg.sender);
    }
}
