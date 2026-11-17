// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Local test-network complaint workflow. Descriptions are public blockchain data.
contract ComplaintTracker {
    enum Status { Submitted, InReview, Resolved }
    struct Complaint {
        address submitter;
        string description;
        Status status;
    }

    address public immutable administrator;
    uint256 public complaintCount;
    mapping(uint256 => Complaint) private complaints;

    event ComplaintSubmitted(uint256 indexed id, address indexed submitter, string description);
    event StatusChanged(uint256 indexed id, Status previousStatus, Status newStatus, address indexed administrator);

    constructor() { administrator = msg.sender; }

    function submitComplaint(string calldata description) external returns (uint256 id) {
        bytes memory content = bytes(description);
        require(content.length > 0 && content.length <= 280, "Description must be 1-280 bytes");
        bool nonWhitespace;
        for (uint256 i; i < content.length; i++) {
            if (content[i] != 0x20 && content[i] != 0x09 && content[i] != 0x0a && content[i] != 0x0d) {
                nonWhitespace = true;
                break;
            }
        }
        require(nonWhitespace, "Description cannot be blank");
        id = ++complaintCount;
        complaints[id] = Complaint(msg.sender, description, Status.Submitted);
        emit ComplaintSubmitted(id, msg.sender, description);
    }

    function getComplaint(uint256 id) external view returns (Complaint memory) {
        require(id > 0 && id <= complaintCount, "Complaint does not exist");
        return complaints[id];
    }

    function updateStatus(uint256 id, Status newStatus) external {
        require(msg.sender == administrator, "Only administrator");
        require(id > 0 && id <= complaintCount, "Complaint does not exist");
        Complaint storage complaint = complaints[id];
        require(complaint.status != Status.Resolved, "Already resolved");
        require(uint256(newStatus) == uint256(complaint.status) + 1, "Must advance one status");
        Status previous = complaint.status;
        complaint.status = newStatus;
        emit StatusChanged(id, previous, newStatus, msg.sender);
    }
}
