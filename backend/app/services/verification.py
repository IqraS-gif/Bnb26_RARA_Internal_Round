"""Verification orchestration service."""

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from app.config import get_settings
from app.schemas.upstream import UpstreamVerificationStatus
from app.schemas.verification import (
    PolicySummary,
    QuorumSummary,
    ReleaseMetadata,
    UpstreamVerificationSummary,
    VerificationRequest,
    VerificationResponse,
)
from app.services.builder_orchestrator import builder_orchestrator
from app.services.verification_store import verification_store
from quorum.blockchain import (
    BlockchainConnectionError,
    BlockchainReader,
    ContractCallError,
    load_deployment_addresses,
)
from quorum.policy import load_trust_policy
from quorum.quorum_engine import QuorumEngine
from quorum.upstream import verify_upstream_git_release

logger = logging.getLogger("quorum.service.verification")


class VerificationService:
    """Service that orchestrates the Quorum consumer verification workflow."""

    def __init__(
        self,
        blockchain_reader: Optional[BlockchainReader] = None,
        rpc_url: Optional[str] = None,
        chain_id: Optional[int] = None,
    ) -> None:
        self.settings = get_settings()
        self.rpc_url = rpc_url or self.settings.rpc_url
        self.chain_id = chain_id or self.settings.chain_id
        self._blockchain_reader = blockchain_reader

    def get_blockchain_reader(self) -> BlockchainReader:
        """Get or initialize the read-only BlockchainReader client."""
        if self._blockchain_reader is not None:
            return self._blockchain_reader
        try:
            return BlockchainReader(
                rpc_url=self.rpc_url,
                chain_id=self.chain_id,
            )
        except BlockchainConnectionError as exc:
            logger.error("Failed to connect to blockchain node: %s", exc)
            raise

    def execute_verification(
        self, request: VerificationRequest
    ) -> VerificationResponse:
        """Run full deterministic consumer verification for a release request.

        1. Verify upstream Git release tag -> commit.
        2. Query smart contract registry on blockchain.
        3. Evaluate builder attestations against local consumer policy.
        4. Calculate quorum and conflict verdicts.
        5. Persist response in verification store.
        """
        verification_id = str(uuid.uuid4())
        started_at = datetime.now(timezone.utc).isoformat()

        # 1. Upstream Git Verification
        upstream_res = verify_upstream_git_release(
            repository=request.repository,
            release_tag=request.release_tag,
            expected_commit=request.source_commit,
        )

        upstream_summary = UpstreamVerificationSummary(
            status=upstream_res.verification_status.value,
            tag=request.release_tag,
            resolved_commit=upstream_res.resolved_commit,
            message=upstream_res.message,
        )

        # 2. Multi-Builder Docker Execution (if enabled and available)
        signed_attestations = []
        builder_executions_data = []

        if not request.skip_docker_build and builder_orchestrator.verify_docker_available():
            logger.info("Executing multi-builder Docker orchestration for %s...", request.release_id)
            try:
                exec_results = builder_orchestrator.execute_all_builders(
                    run_id=verification_id,
                    release_id=request.release_id,
                    repository=request.repository,
                    release_tag=request.release_tag,
                    source_commit=request.source_commit,
                    artifact_reference=request.artifact_reference or "junegunn/fzf/releases/download/v0.74.4/fzf",
                    mode=request.verification_mode or "normal",
                    failed_builder_id=request.simulated_failure_builder,
                    demo_scenario=request.demo_scenario or "normal",
                )
                for er in exec_results:
                    if er.signed_attestation is not None:
                        signed_attestations.append(er.signed_attestation)
                    builder_executions_data.append(er.model_dump(exclude={"signed_attestation"}))
            except Exception as b_exc:
                logger.error("Multi-builder Docker orchestration error: %s", b_exc)

        # 3. Blockchain and Quorum Engine Execution
        reader = self.get_blockchain_reader()
        policy = load_trust_policy()
        engine = QuorumEngine(blockchain_reader=reader, policy=policy)

        engine_result = engine.verify(
            release_id=request.release_id,
            repository=request.repository,
            release_tag=request.release_tag,
            source_commit=request.source_commit,
            expected_artifact_hash=request.expected_artifact_hash,
            signed_attestations=signed_attestations if signed_attestations else None,
            verify_upstream=False,  # Already executed above for structured metadata
        )

        completed_at = datetime.now(timezone.utc).isoformat()

        # Build comprehensive structured evidence
        deployments = load_deployment_addresses()
        evidence_dict = {
            "chain_id": reader.chain_id,
            "rpc_url": self.rpc_url,
            "registry_contracts": deployments,
            "upstream_verification": upstream_res.model_dump(),
            "quorum_evidence": engine_result.evidence,
            "policy": {
                "required_quorum": policy.required_quorum,
                "trusted_builders": policy.trusted_builders,
            },
            "expected_artifact_hash": request.expected_artifact_hash,
            "artifact_reference": request.artifact_reference,
            "builder_executions": builder_executions_data,
            "verification_mode": request.verification_mode or "normal",
            "demo_scenario": request.demo_scenario or "normal",
        }

        response = VerificationResponse(
            verification_id=verification_id,
            status=engine_result.status,
            release=ReleaseMetadata(
                release_id=request.release_id,
                repository=request.repository,
                tag=request.release_tag,
                source_commit=request.source_commit,
            ),
            upstream=upstream_summary,
            policy=PolicySummary(
                required_quorum=policy.required_quorum,
                trusted_builder_count=policy.trusted_builder_count,
            ),
            summary=QuorumSummary(
                valid_builder_count=engine_result.valid_builder_count,
                missing_builder_count=engine_result.missing_builder_count,
                conflicting_builder_count=engine_result.conflicting_builder_count,
                agreed_artifact_hash=engine_result.quorum_artifact_hash,
            ),
            builders=engine_result.builders,
            explanation=engine_result.explanation,
            evidence=evidence_dict,
            timestamps={
                "started_at": started_at,
                "completed_at": completed_at,
            },
        )

        # Save to store
        verification_store.save(response)
        return response


# Global service instance
verification_service = VerificationService()
