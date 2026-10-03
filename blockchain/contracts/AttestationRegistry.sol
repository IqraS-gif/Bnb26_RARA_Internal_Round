// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./BuilderRegistry.sol";
import "./ReleaseRegistry.sol";

/**
 * @title AttestationRegistry
 * @notice Auditable evidence registry for multi-builder release attestations.
 * @dev Preserves historical evidence, superseding older attestations without deleting history.
 */
contract AttestationRegistry is Ownable {
    enum AttestationStatus {
        ACTIVE,
        SUPERSEDED
    }

    struct AttestationRecord {
        bytes32 releaseId;
        address builderAddress;
        bytes32 artifactHash;
        bytes32 attestationHash;
        string attestationReference;
        uint256 timestamp;
        AttestationStatus status;
    }

    // Registry contract references
    BuilderRegistry public immutable builderRegistry;
    ReleaseRegistry public immutable releaseRegistry;

    // Array of all historical attestation records
    AttestationRecord[] private _attestations;

    // Mapping: releaseId => builderAddress => 1-based index in _attestations
    mapping(bytes32 => mapping(address => uint256)) private _latestAttestationIndex;

    // Events
    event AttestationSubmitted(
        bytes32 indexed releaseId,
        address indexed builderAddress,
        bytes32 artifactHash,
        bytes32 attestationHash,
        string attestationReference,
        uint256 timestamp
    );
    event AttestationSuperseded(
        bytes32 indexed releaseId,
        address indexed builderAddress,
        uint256 previousIndex,
        uint256 newIndex,
        uint256 timestamp
    );
    event EquivocationDetected(
        bytes32 indexed releaseId, address indexed builderAddress, bytes32 previousArtifactHash, bytes32 newArtifactHash
    );

    // Custom errors
    error ZeroAddress();
    error ReleaseNotFound(bytes32 releaseId);
    error BuilderNotActive(address builder);
    error ZeroBytes32(string field);
    error AttestationNotFound(bytes32 releaseId, address builder);
    error IndexOutOfBounds(uint256 index);

    /**
     * @notice Initialize the AttestationRegistry with references to Builder and Release registries.
     * @param initialOwner Administrator address for registry management.
     * @param _builderRegistry Address of the BuilderRegistry contract.
     * @param _releaseRegistry Address of the ReleaseRegistry contract.
     */
    constructor(address initialOwner, address _builderRegistry, address _releaseRegistry) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        if (_builderRegistry == address(0)) revert ZeroAddress();
        if (_releaseRegistry == address(0)) revert ZeroAddress();

        builderRegistry = BuilderRegistry(_builderRegistry);
        releaseRegistry = ReleaseRegistry(_releaseRegistry);
    }

    /**
     * @notice Submit a signed builder attestation for a registered release.
     * @dev Automatically detects equivocation and supersedes previous attestations from the same builder.
     * @param releaseId Unique deterministic identifier of the release.
     * @param builderAddress Cryptographic signing address of the builder providing evidence.
     * @param artifactHash SHA-256 hash of the reproduced software artifact.
     * @param attestationHash Hash commitment of the full signed attestation object.
     * @param attestationReference Off-chain URI/path reference to the attestation evidence payload.
     */
    function submitAttestation(
        bytes32 releaseId,
        address builderAddress,
        bytes32 artifactHash,
        bytes32 attestationHash,
        string calldata attestationReference
    ) external {
        if (builderAddress == address(0)) revert ZeroAddress();
        if (releaseId == bytes32(0)) revert ZeroBytes32("releaseId");
        if (artifactHash == bytes32(0)) revert ZeroBytes32("artifactHash");
        if (attestationHash == bytes32(0)) revert ZeroBytes32("attestationHash");

        // Validate that the release exists
        if (!releaseRegistry.isReleaseRegistered(releaseId)) {
            revert ReleaseNotFound(releaseId);
        }

        // Validate that the builder is registered and active
        if (!builderRegistry.isActiveBuilder(builderAddress)) {
            revert BuilderNotActive(builderAddress);
        }

        uint256 existing1BasedIdx = _latestAttestationIndex[releaseId][builderAddress];
        uint256 new0BasedIdx = _attestations.length;

        if (existing1BasedIdx > 0) {
            uint256 prev0BasedIdx = existing1BasedIdx - 1;
            AttestationRecord storage prev = _attestations[prev0BasedIdx];

            // Detect equivocation (same release + same builder + different artifact hash)
            if (prev.artifactHash != artifactHash) {
                emit EquivocationDetected(releaseId, builderAddress, prev.artifactHash, artifactHash);
            }

            // Mark previous attestation as SUPERSEDED without deleting historical record
            prev.status = AttestationStatus.SUPERSEDED;
            emit AttestationSuperseded(releaseId, builderAddress, prev0BasedIdx, new0BasedIdx, block.timestamp);
        }

        // Store new active attestation
        _attestations.push(
            AttestationRecord({
                releaseId: releaseId,
                builderAddress: builderAddress,
                artifactHash: artifactHash,
                attestationHash: attestationHash,
                attestationReference: attestationReference,
                timestamp: block.timestamp,
                status: AttestationStatus.ACTIVE
            })
        );

        _latestAttestationIndex[releaseId][builderAddress] = new0BasedIdx + 1;

        emit AttestationSubmitted(
            releaseId, builderAddress, artifactHash, attestationHash, attestationReference, block.timestamp
        );
    }

    /**
     * @notice Retrieve the latest attestation for a specific release and builder.
     * @param releaseId Identifier of the release.
     * @param builderAddress Address of the builder.
     * @return record AttestationRecord containing the evidence data.
     */
    function getLatestAttestation(bytes32 releaseId, address builderAddress)
        external
        view
        returns (AttestationRecord memory record)
    {
        uint256 index1Based = _latestAttestationIndex[releaseId][builderAddress];
        if (index1Based == 0) {
            revert AttestationNotFound(releaseId, builderAddress);
        }
        return _attestations[index1Based - 1];
    }

    /**
     * @notice Check whether an attestation exists for a release and builder.
     * @param releaseId Identifier of the release.
     * @param builderAddress Address of the builder.
     * @return True if at least one attestation has been submitted; false otherwise.
     */
    function hasAttestation(bytes32 releaseId, address builderAddress) external view returns (bool) {
        return _latestAttestationIndex[releaseId][builderAddress] > 0;
    }

    /**
     * @notice Get the total count of all historical attestations recorded.
     * @return Total count of records in storage.
     */
    function getAttestationCount() external view returns (uint256) {
        return _attestations.length;
    }

    /**
     * @notice Retrieve an attestation record by its global storage index.
     * @param index 0-based index in storage array.
     * @return record The attestation record.
     */
    function getAttestation(uint256 index) external view returns (AttestationRecord memory record) {
        if (index >= _attestations.length) revert IndexOutOfBounds(index);
        return _attestations[index];
    }
}
