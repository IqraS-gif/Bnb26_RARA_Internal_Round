// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/BuilderRegistry.sol";
import "../contracts/ReleaseRegistry.sol";
import "../contracts/AttestationRegistry.sol";

contract AttestationRegistryTest is Test {
    BuilderRegistry public builderRegistry;
    ReleaseRegistry public releaseRegistry;
    AttestationRegistry public attestationRegistry;

    address public admin = address(0xAD);
    address public builderA = address(0x11);
    address public builderB = address(0x22);
    address public inactiveBuilder = address(0x33);

    bytes32 public releaseId = keccak256("fzf-v0.74.4");
    bytes32 public sourceCommit = bytes32(0xa140afeb4d733cad3c96a56bf6db7e26853b6757000000000000000000000000);
    bytes32 public artifactHashA = bytes32(0xbed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3);
    bytes32 public artifactHashB = bytes32(0x0000000000000000000000000000000000000000000000000000000000000002);
    bytes32 public attestationHashA = keccak256("signed-attestation-a");
    bytes32 public attestationHashB = keccak256("signed-attestation-b");

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

    function setUp() public {
        vm.startPrank(admin);
        builderRegistry = new BuilderRegistry(admin);
        releaseRegistry = new ReleaseRegistry(admin);
        attestationRegistry = new AttestationRegistry(admin, address(builderRegistry), address(releaseRegistry));

        // Register active builders
        builderRegistry.registerBuilder(builderA, "Builder A", "docker-linux-amd64");
        builderRegistry.registerBuilder(builderB, "Builder B", "docker-linux-amd64");

        // Register and deactivate one builder
        builderRegistry.registerBuilder(inactiveBuilder, "Inactive Builder", "docker");
        builderRegistry.deactivateBuilder(inactiveBuilder);

        // Register release
        releaseRegistry.registerRelease(releaseId, "https://github.com/junegunn/fzf.git", "v0.74.4", sourceCommit);
        vm.stopPrank();
    }

    function test_SubmitAttestation_Success() public {
        vm.expectEmit(true, true, false, true);
        emit AttestationSubmitted(
            releaseId, builderA, artifactHashA, attestationHashA, "artifacts/builder-a/fzf", block.timestamp
        );

        attestationRegistry.submitAttestation(
            releaseId, builderA, artifactHashA, attestationHashA, "artifacts/builder-a/fzf"
        );

        assertTrue(attestationRegistry.hasAttestation(releaseId, builderA));
        assertEq(attestationRegistry.getAttestationCount(), 1);

        AttestationRegistry.AttestationRecord memory rec = attestationRegistry.getLatestAttestation(releaseId, builderA);

        assertEq(rec.releaseId, releaseId);
        assertEq(rec.builderAddress, builderA);
        assertEq(rec.artifactHash, artifactHashA);
        assertEq(rec.attestationHash, attestationHashA);
        assertEq(rec.attestationReference, "artifacts/builder-a/fzf");
        assertEq(rec.timestamp, block.timestamp);
        assertEq(uint256(rec.status), uint256(AttestationRegistry.AttestationStatus.ACTIVE));
    }

    function test_SubmitAttestation_RevertIfUnknownRelease() public {
        bytes32 unknownRelease = keccak256("unknown-release-id");
        vm.expectRevert(abi.encodeWithSelector(AttestationRegistry.ReleaseNotFound.selector, unknownRelease));

        attestationRegistry.submitAttestation(unknownRelease, builderA, artifactHashA, attestationHashA, "ref");
    }

    function test_SubmitAttestation_RevertIfInactiveOrUnregisteredBuilder() public {
        vm.expectRevert(abi.encodeWithSelector(AttestationRegistry.BuilderNotActive.selector, inactiveBuilder));
        attestationRegistry.submitAttestation(releaseId, inactiveBuilder, artifactHashA, attestationHashA, "ref");

        address unregistered = address(0x999);
        vm.expectRevert(abi.encodeWithSelector(AttestationRegistry.BuilderNotActive.selector, unregistered));
        attestationRegistry.submitAttestation(releaseId, unregistered, artifactHashA, attestationHashA, "ref");
    }

    function test_SubmitAttestation_RevertIfZeroAddressOrBytes() public {
        vm.expectRevert(AttestationRegistry.ZeroAddress.selector);
        attestationRegistry.submitAttestation(releaseId, address(0), artifactHashA, attestationHashA, "ref");

        vm.expectRevert(abi.encodeWithSelector(AttestationRegistry.ZeroBytes32.selector, "releaseId"));
        attestationRegistry.submitAttestation(bytes32(0), builderA, artifactHashA, attestationHashA, "ref");

        vm.expectRevert(abi.encodeWithSelector(AttestationRegistry.ZeroBytes32.selector, "artifactHash"));
        attestationRegistry.submitAttestation(releaseId, builderA, bytes32(0), attestationHashA, "ref");
    }

    function test_AttestationSuperseding_PreservesHistory() public {
        // Initial submission
        attestationRegistry.submitAttestation(releaseId, builderA, artifactHashA, attestationHashA, "artifacts/v1");

        assertEq(attestationRegistry.getAttestationCount(), 1);

        // Advance time
        vm.warp(block.timestamp + 100);

        // Submit updated attestation with same artifact hash (e.g. metadata correction)
        bytes32 updatedAttestationHash = keccak256("signed-attestation-a-v2");

        vm.expectEmit(true, true, false, true);
        emit AttestationSuperseded(releaseId, builderA, 0, 1, block.timestamp);

        attestationRegistry.submitAttestation(
            releaseId, builderA, artifactHashA, updatedAttestationHash, "artifacts/v2"
        );

        assertEq(attestationRegistry.getAttestationCount(), 2);

        // Previous attestation record is preserved and marked SUPERSEDED
        AttestationRegistry.AttestationRecord memory oldRec = attestationRegistry.getAttestation(0);
        assertEq(uint256(oldRec.status), uint256(AttestationRegistry.AttestationStatus.SUPERSEDED));
        assertEq(oldRec.attestationHash, attestationHashA);

        // Latest attestation is ACTIVE
        AttestationRegistry.AttestationRecord memory latestRec =
            attestationRegistry.getLatestAttestation(releaseId, builderA);
        assertEq(uint256(latestRec.status), uint256(AttestationRegistry.AttestationStatus.ACTIVE));
        assertEq(latestRec.attestationHash, updatedAttestationHash);
    }

    function test_EquivocationDetection_EmitsEvent() public {
        // First submission by Builder A
        attestationRegistry.submitAttestation(releaseId, builderA, artifactHashA, attestationHashA, "ref1");

        // Builder A submits a conflicting hash for the same release
        bytes32 conflictingHash = bytes32(0x9999999999999999999999999999999999999999999999999999999999999999);

        vm.expectEmit(true, true, false, true);
        emit EquivocationDetected(releaseId, builderA, artifactHashA, conflictingHash);

        attestationRegistry.submitAttestation(
            releaseId, builderA, conflictingHash, keccak256("conflicting-attestation"), "ref2"
        );

        assertEq(attestationRegistry.getAttestationCount(), 2);
    }

    function test_NonConflictingResubmission_DoesNotEmitEquivocation() public {
        // Record logs to ensure EquivocationDetected is NOT emitted
        attestationRegistry.submitAttestation(releaseId, builderA, artifactHashA, attestationHashA, "ref1");

        vm.recordLogs();
        attestationRegistry.submitAttestation(releaseId, builderA, artifactHashA, attestationHashB, "ref2");

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 equivocationTopic = keccak256("EquivocationDetected(bytes32,address,bytes32,bytes32)");

        for (uint256 i = 0; i < entries.length; i++) {
            assertTrue(entries[i].topics[0] != equivocationTopic, "EquivocationDetected should not be emitted");
        }
    }
}
