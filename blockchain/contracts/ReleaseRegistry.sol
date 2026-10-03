// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReleaseRegistry
 * @notice Maintains registry of upstream software releases and pinned source commits.
 * @dev Records identity/evidence only. Does not store source code or binaries.
 */
contract ReleaseRegistry is Ownable {
    struct Release {
        bool isRegistered;
        string repository;
        string releaseTag;
        bytes32 sourceCommit;
        uint256 registeredAt;
    }

    // Mapping from deterministic releaseId to Release metadata
    mapping(bytes32 => Release) private _releases;

    // Events
    event ReleaseRegistered(
        bytes32 indexed releaseId, string repository, string releaseTag, bytes32 sourceCommit, uint256 timestamp
    );

    // Custom errors
    error ZeroAddress();
    error ReleaseAlreadyRegistered(bytes32 releaseId);
    error ReleaseNotRegistered(bytes32 releaseId);
    error ZeroBytes32(string field);
    error EmptyString(string field);

    /**
     * @notice Initialize the ReleaseRegistry with an administrator owner.
     * @param initialOwner Administrator address for registry management.
     */
    constructor(address initialOwner) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
    }

    /**
     * @notice Register a new software release to be verified by builders.
     * @param releaseId Unique deterministic identifier for the release.
     * @param repository Canonical repository URL or identifier.
     * @param releaseTag Exact upstream release tag (e.g. v0.74.4).
     * @param sourceCommit Pinned 32-byte representation of the Git commit SHA.
     */
    function registerRelease(
        bytes32 releaseId,
        string calldata repository,
        string calldata releaseTag,
        bytes32 sourceCommit
    ) external onlyOwner {
        if (releaseId == bytes32(0)) revert ZeroBytes32("releaseId");
        if (sourceCommit == bytes32(0)) revert ZeroBytes32("sourceCommit");
        if (bytes(repository).length == 0) revert EmptyString("repository");
        if (bytes(releaseTag).length == 0) revert EmptyString("releaseTag");
        if (_releases[releaseId].isRegistered) revert ReleaseAlreadyRegistered(releaseId);

        _releases[releaseId] = Release({
            isRegistered: true,
            repository: repository,
            releaseTag: releaseTag,
            sourceCommit: sourceCommit,
            registeredAt: block.timestamp
        });

        emit ReleaseRegistered(releaseId, repository, releaseTag, sourceCommit, block.timestamp);
    }

    /**
     * @notice Retrieve details for a registered release.
     * @param releaseId Identifier of the release.
     * @return isRegistered Whether the release is registered.
     * @return repository Canonical repository URL.
     * @return releaseTag Release tag name.
     * @return sourceCommit Pinned Git commit SHA.
     * @return registeredAt Timestamp of registration.
     */
    function getRelease(bytes32 releaseId)
        external
        view
        returns (
            bool isRegistered,
            string memory repository,
            string memory releaseTag,
            bytes32 sourceCommit,
            uint256 registeredAt
        )
    {
        Release storage r = _releases[releaseId];
        return (r.isRegistered, r.repository, r.releaseTag, r.sourceCommit, r.registeredAt);
    }

    /**
     * @notice Check whether a release identifier is registered.
     * @param releaseId Identifier to query.
     * @return True if registered; false otherwise.
     */
    function isReleaseRegistered(bytes32 releaseId) external view returns (bool) {
        return _releases[releaseId].isRegistered;
    }
}
