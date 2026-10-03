"""Quorum verification engine.

Applies local consumer trust policy, validates on-chain records, verifies
EIP-712 cryptographic signatures, analyzes builder agreement, and yields
deterministic verification verdicts.
"""

from collections import defaultdict
from typing import Any, Dict, List, Optional, Set
from eth_utils import to_checksum_address

from app.schemas.signing import SignedAttestation
from quorum.artifacts import compare_artifact_hashes
from quorum.blockchain import BlockchainReader, ReleaseRecord, to_bytes32_release_id
from quorum.policy import TrustPolicy, load_trust_policy
from quorum.signatures import verify_signed_attestation
from quorum.upstream import verify_upstream_git_release
from quorum.verdicts import (
    BuilderStatus,
    BuilderVerificationResult,
    VerificationResult,
    VerificationStatus,
)


class QuorumEngine:
    """Deterministic consumer-side verification engine."""

    def __init__(
        self,
        blockchain_reader: BlockchainReader,
        policy: Optional[TrustPolicy] = None,
    ) -> None:
        """Initialize QuorumEngine with a blockchain client and consumer trust policy.

        Args:
            blockchain_reader: Read-only blockchain client connected to RPC node.
            policy: Consumer trust policy loaded from local trusted-builders.json.
        """
        self.blockchain = blockchain_reader
        self.policy = policy or load_trust_policy()

    def verify(
        self,
        release_id: str,
        repository: Optional[str] = None,
        release_tag: Optional[str] = None,
        source_commit: Optional[str] = None,
        expected_artifact_hash: Optional[str] = None,
        signed_attestations: Optional[List[SignedAttestation]] = None,
        verify_upstream: bool = False,
    ) -> VerificationResult:
        """Perform comprehensive deterministic quorum verification on a release.

        Steps:
        1. Read and verify on-chain release record from ReleaseRegistry.
        2. Optionally verify upstream Git tag -> commit resolution.
        3. Evaluate each trusted builder in consumer policy:
           - Check BuilderRegistry active status.
           - Read latest on-chain attestation.
           - Cryptographically verify EIP-712 signatures if off-chain payloads provided.
        4. Group valid attestations by artifact SHA-256 hash.
        5. Detect conflicts and evaluate quorum threshold against local policy.
        6. Return deterministic, explainable VerificationResult.

        Args:
            release_id: Unique software release identifier (e.g. 'fzf-v0.74.4').
            repository: Optional repository URL (if provided, validated against on-chain record).
            release_tag: Optional release tag (if provided, validated against on-chain record).
            source_commit: Optional source commit SHA (if provided, validated against on-chain record).
            expected_artifact_hash: Optional expected artifact SHA-256 hash.
            signed_attestations: Optional list of SignedAttestation objects containing signatures.
            verify_upstream: If True, executes git ls-remote to verify upstream tag resolution.

        Returns:
            VerificationResult with status (ACCEPT, ACCEPT_WITH_WARNING, REJECT) and evidence.
        """
        b32_release_id = to_bytes32_release_id(release_id)
        release_record = self.blockchain.get_release(b32_release_id)

        # Base metadata defaults
        repo = repository or (release_record.repository if release_record else "")
        tag = release_tag or (release_record.release_tag if release_record else "")
        commit = source_commit or (release_record.source_commit if release_record else "")

        # 1. On-chain Release Check
        if release_record is None or not release_record.is_registered:
            return VerificationResult(
                status=VerificationStatus.REJECT,
                release_id=release_id,
                repository=repo,
                release_tag=tag,
                source_commit=commit,
                expected_artifact_hash=expected_artifact_hash,
                required_quorum=self.policy.required_quorum,
                trusted_builder_count=self.policy.trusted_builder_count,
                valid_builder_count=0,
                missing_builder_count=self.policy.trusted_builder_count,
                conflicting_builder_count=0,
                builders=[],
                explanation=f"Release '{release_id}' is not registered in ReleaseRegistry.",
                evidence={"release_registered": False},
            )

        # Validate claimed release metadata matches on-chain record
        if repository and repository.strip() != release_record.repository.strip():
            return VerificationResult(
                status=VerificationStatus.REJECT,
                release_id=release_id,
                repository=repository,
                release_tag=tag,
                source_commit=commit,
                expected_artifact_hash=expected_artifact_hash,
                required_quorum=self.policy.required_quorum,
                trusted_builder_count=self.policy.trusted_builder_count,
                valid_builder_count=0,
                missing_builder_count=self.policy.trusted_builder_count,
                conflicting_builder_count=0,
                builders=[],
                explanation=(
                    f"Claimed repository '{repository}' does not match "
                    f"on-chain registered repository '{release_record.repository}'."
                ),
                evidence={"claimed_repository": repository, "onchain_repository": release_record.repository},
            )

        if release_tag and release_tag.strip() != release_record.release_tag.strip():
            return VerificationResult(
                status=VerificationStatus.REJECT,
                release_id=release_id,
                repository=repo,
                release_tag=release_tag,
                source_commit=commit,
                expected_artifact_hash=expected_artifact_hash,
                required_quorum=self.policy.required_quorum,
                trusted_builder_count=self.policy.trusted_builder_count,
                valid_builder_count=0,
                missing_builder_count=self.policy.trusted_builder_count,
                conflicting_builder_count=0,
                builders=[],
                explanation=(
                    f"Claimed release tag '{release_tag}' does not match "
                    f"on-chain registered tag '{release_record.release_tag}'."
                ),
                evidence={"claimed_tag": release_tag, "onchain_tag": release_record.release_tag},
            )

        if source_commit:
            norm_claimed_commit = source_commit.strip().lower()
            norm_onchain_commit = release_record.source_commit.strip().lower()
            # Support 40-character prefix match if right-padded
            if not norm_onchain_commit.startswith(norm_claimed_commit):
                return VerificationResult(
                    status=VerificationStatus.REJECT,
                    release_id=release_id,
                    repository=repo,
                    release_tag=tag,
                    source_commit=source_commit,
                    expected_artifact_hash=expected_artifact_hash,
                    required_quorum=self.policy.required_quorum,
                    trusted_builder_count=self.policy.trusted_builder_count,
                    valid_builder_count=0,
                    missing_builder_count=self.policy.trusted_builder_count,
                    conflicting_builder_count=0,
                    builders=[],
                    explanation=(
                        f"Claimed commit '{source_commit}' does not match "
                        f"on-chain registered commit '{release_record.source_commit}'."
                    ),
                    evidence={"claimed_commit": source_commit, "onchain_commit": release_record.source_commit},
                )

        # 2. Upstream Git Verification (if requested)
        if verify_upstream and repo and tag:
            upstream_res = verify_upstream_git_release(
                repository=repo,
                release_tag=tag,
                expected_commit=commit,
            )
            if not upstream_res.tag_exists or not upstream_res.commit_matches:
                return VerificationResult(
                    status=VerificationStatus.REJECT,
                    release_id=release_id,
                    repository=repo,
                    release_tag=tag,
                    source_commit=commit,
                    expected_artifact_hash=expected_artifact_hash,
                    required_quorum=self.policy.required_quorum,
                    trusted_builder_count=self.policy.trusted_builder_count,
                    valid_builder_count=0,
                    missing_builder_count=self.policy.trusted_builder_count,
                    conflicting_builder_count=0,
                    builders=[],
                    explanation=f"Upstream Git verification failed: {upstream_res.message}",
                    evidence={"upstream_verification": upstream_res.model_dump()},
                )

        # Index signed attestations by builder address
        signed_map: Dict[str, SignedAttestation] = {}
        if signed_attestations:
            for sa in signed_attestations:
                b_addr_norm = to_checksum_address(sa.attestation.builder_address)
                signed_map[b_addr_norm] = sa

        # 3. Evaluate each builder in the local consumer trust policy
        builder_results: List[BuilderVerificationResult] = []
        hash_to_builders: Dict[str, List[str]] = defaultdict(list)
        valid_builder_addrs: Set[str] = set()

        for trusted_addr in self.policy.trusted_builders:
            # Check BuilderRegistry status
            builder_rec = self.blockchain.get_builder(trusted_addr)
            is_active = builder_rec.active if builder_rec and builder_rec.is_registered else False
            b_name = builder_rec.name if builder_rec and builder_rec.is_registered else None

            if not is_active:
                builder_results.append(
                    BuilderVerificationResult(
                        builder_address=trusted_addr,
                        builder_name=b_name,
                        policy_status="TRUSTED",
                        registry_status="INACTIVE" if builder_rec and builder_rec.is_registered else "UNREGISTERED",
                        signature_status="NOT_CHECKED",
                        status=BuilderStatus.INACTIVE,
                        explanation="Builder is not active in BuilderRegistry.",
                    )
                )
                continue

            # Read latest on-chain attestation
            att_rec = self.blockchain.get_latest_attestation(b32_release_id, trusted_addr)
            if att_rec is None or att_rec.status == "SUPERSEDED":
                builder_results.append(
                    BuilderVerificationResult(
                        builder_address=trusted_addr,
                        builder_name=b_name,
                        policy_status="TRUSTED",
                        registry_status="ACTIVE",
                        signature_status="MISSING",
                        status=BuilderStatus.MISSING,
                        explanation="No active on-chain attestation found for this release.",
                    )
                )
                continue

            # Check EIP-712 signature if signed attestation payload is provided
            sig_status = "VALID"
            sig_valid = True
            explanation_note = None

            if trusted_addr in signed_map:
                sa = signed_map[trusted_addr]
                # Cryptographically verify the signature
                sig_ok = verify_signed_attestation(
                    signed_attestation=sa,
                    expected_chain_id=self.blockchain.chain_id,
                    expected_builder=trusted_addr,
                )
                if not sig_ok:
                    sig_valid = False
                    sig_status = "INVALID"
                    explanation_note = "EIP-712 cryptographic signature verification failed."
                else:
                    # Check that payload fields match on-chain record
                    sa_hash = sa.attestation.artifact_hash.strip().lower().removeprefix("0x")
                    onchain_hash = att_rec.artifact_hash.strip().lower().removeprefix("0x")
                    if sa_hash != onchain_hash:
                        sig_valid = False
                        sig_status = "INVALID"
                        explanation_note = "Signed payload artifact hash does not match on-chain record."

            if not sig_valid:
                builder_results.append(
                    BuilderVerificationResult(
                        builder_address=trusted_addr,
                        builder_name=b_name,
                        policy_status="TRUSTED",
                        registry_status="ACTIVE",
                        signature_status=sig_status,
                        status=BuilderStatus.INVALID_SIGNATURE,
                        artifact_hash=att_rec.artifact_hash,
                        timestamp=att_rec.timestamp,
                        attestation_reference=att_rec.attestation_reference,
                        explanation=explanation_note,
                    )
                )
                continue

            # Valid trusted active builder attestation
            norm_hash = att_rec.artifact_hash.strip().lower().removeprefix("0x")
            hash_to_builders[norm_hash].append(trusted_addr)
            valid_builder_addrs.add(trusted_addr)

            builder_results.append(
                BuilderVerificationResult(
                    builder_address=trusted_addr,
                    builder_name=b_name,
                    policy_status="TRUSTED",
                    registry_status="ACTIVE",
                    signature_status=sig_status,
                    status=BuilderStatus.VALID,
                    artifact_hash=norm_hash,
                    timestamp=att_rec.timestamp,
                    attestation_reference=att_rec.attestation_reference,
                    explanation="Valid attestation verified.",
                )
            )

        # 4. Quorum & Conflict Evaluation
        # If there are multiple distinct valid artifact hashes among trusted builders -> CONFLICT!
        num_distinct_hashes = len(hash_to_builders)
        
        # Determine plurality / primary agreed hash if any
        agreed_hash: Optional[str] = None
        max_matching_count = 0
        for h, b_list in hash_to_builders.items():
            if len(b_list) > max_matching_count:
                max_matching_count = len(b_list)
                agreed_hash = h

        # Detect conflicts among trusted builders
        conflicting_count = 0
        if num_distinct_hashes > 1:
            # We have distinct hashes signed by trusted builders!
            # Mark builders with non-matching hashes as CONFLICTING
            conflicting_addrs: Set[str] = set()
            for h, b_list in hash_to_builders.items():
                if h != agreed_hash:
                    conflicting_addrs.update(b_list)
                    conflicting_count += len(b_list)

            updated_builder_results: List[BuilderVerificationResult] = []
            for b_res in builder_results:
                if b_res.builder_address in conflicting_addrs:
                    updated_builder_results.append(
                        b_res.model_copy(
                            update={
                                "status": BuilderStatus.CONFLICTING,
                                "matches_quorum_hash": False,
                                "explanation": f"Conflicting artifact hash {b_res.artifact_hash} differs from {agreed_hash}.",
                            }
                        )
                    )
                else:
                    matches = (b_res.artifact_hash == agreed_hash) if agreed_hash else False
                    updated_builder_results.append(
                        b_res.model_copy(update={"matches_quorum_hash": matches})
                    )
            builder_results = updated_builder_results
        else:
            # All valid trusted builders agree on the same hash
            updated_builder_results = []
            for b_res in builder_results:
                matches = (b_res.artifact_hash == agreed_hash) if agreed_hash and b_res.status == BuilderStatus.VALID else False
                updated_builder_results.append(
                    b_res.model_copy(update={"matches_quorum_hash": matches})
                )
            builder_results = updated_builder_results

        # Calculate counts
        valid_matching_count = max_matching_count
        missing_count = sum(1 for b in builder_results if b.status == BuilderStatus.MISSING)
        inactive_count = sum(1 for b in builder_results if b.status == BuilderStatus.INACTIVE)
        invalid_sig_count = sum(1 for b in builder_results if b.status == BuilderStatus.INVALID_SIGNATURE)
        total_trusted = self.policy.trusted_builder_count
        required_quorum = self.policy.required_quorum

        # Final verdict determination
        if num_distinct_hashes > 1:
            # Any conflict among trusted builders causes REJECT
            verdict_status = VerificationStatus.REJECT
            explanation = (
                f"REJECT: Conflicting artifact hashes detected among trusted builders "
                f"({valid_matching_count} builders agreed on {agreed_hash}, but {conflicting_count} conflicting)."
            )
        elif valid_matching_count >= required_quorum:
            # Check expected artifact hash if specified
            if expected_artifact_hash is not None:
                norm_expected = expected_artifact_hash.strip().lower().removeprefix("0x")
                if not compare_artifact_hashes(norm_expected, agreed_hash or ""):
                    return VerificationResult(
                        status=VerificationStatus.REJECT,
                        release_id=release_id,
                        repository=repo,
                        release_tag=tag,
                        source_commit=commit,
                        expected_artifact_hash=expected_artifact_hash,
                        quorum_artifact_hash=agreed_hash,
                        required_quorum=required_quorum,
                        trusted_builder_count=total_trusted,
                        valid_builder_count=valid_matching_count,
                        missing_builder_count=missing_count,
                        conflicting_builder_count=conflicting_count,
                        builders=builder_results,
                        explanation=(
                            f"REJECT: Quorum agreed on artifact hash {agreed_hash}, "
                            f"which does not match expected artifact hash {expected_artifact_hash}."
                        ),
                        evidence={"quorum_hash": agreed_hash, "expected_hash": expected_artifact_hash},
                    )

            # If all trusted builders have valid matching attestations
            if valid_matching_count == total_trusted:
                verdict_status = VerificationStatus.ACCEPT
                explanation = (
                    f"ACCEPT: Quorum reached with full agreement from all {total_trusted} "
                    f"trusted builders (artifact hash: {agreed_hash})."
                )
            else:
                # Quorum reached, but some trusted builder is missing or inactive
                verdict_status = VerificationStatus.ACCEPT_WITH_WARNING
                missing_inactive = missing_count + inactive_count + invalid_sig_count
                explanation = (
                    f"ACCEPT_WITH_WARNING: Quorum reached by {valid_matching_count} of {total_trusted} "
                    f"trusted builders ({missing_inactive} builder(s) missing/inactive/invalid). "
                    f"Artifact hash: {agreed_hash}."
                )
        else:
            verdict_status = VerificationStatus.REJECT
            explanation = (
                f"REJECT: Insufficient valid attestations ({valid_matching_count} < "
                f"required quorum {required_quorum})."
            )

        return VerificationResult(
            status=verdict_status,
            release_id=release_id,
            repository=repo,
            release_tag=tag,
            source_commit=commit,
            expected_artifact_hash=expected_artifact_hash,
            quorum_artifact_hash=agreed_hash if valid_matching_count >= required_quorum else None,
            required_quorum=required_quorum,
            trusted_builder_count=total_trusted,
            valid_builder_count=valid_matching_count,
            missing_builder_count=missing_count,
            conflicting_builder_count=conflicting_count,
            builders=builder_results,
            explanation=explanation,
            evidence={
                "chain_id": self.blockchain.chain_id,
                "release_registered_at": release_record.registered_at,
                "hash_distribution": {k: len(v) for k, v in hash_to_builders.items()},
            },
        )


def verify_release_quorum(
    release_id: str,
    repository: Optional[str] = None,
    release_tag: Optional[str] = None,
    source_commit: Optional[str] = None,
    expected_artifact_hash: Optional[str] = None,
    signed_attestations: Optional[List[SignedAttestation]] = None,
    policy: Optional[TrustPolicy] = None,
    blockchain_reader: Optional[BlockchainReader] = None,
    verify_upstream: bool = False,
) -> VerificationResult:
    """Convenience function to run release quorum verification."""
    reader = blockchain_reader or BlockchainReader()
    engine = QuorumEngine(blockchain_reader=reader, policy=policy)
    return engine.verify(
        release_id=release_id,
        repository=repository,
        release_tag=release_tag,
        source_commit=source_commit,
        expected_artifact_hash=expected_artifact_hash,
        signed_attestations=signed_attestations,
        verify_upstream=verify_upstream,
    )
