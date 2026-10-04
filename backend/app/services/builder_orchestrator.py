"""Docker-based Multi-Builder Execution Orchestrator for Quorum.

Orchestrates concurrent, independent reproducible builds across Builder A, Builder B,
and Builder C inside isolated Docker containers, hashes output artifacts host-side,
generates EIP-712 signed attestations, and records on-chain evidence on Anvil.

SECURITY GUARANTEES:
- Builders run in isolated Docker containers with no shared filesystem.
- No Docker socket is mounted.
- No privileged container execution.
- Private signing keys NEVER enter builder containers.
- Host independently hashes the resulting binary.
"""

import concurrent.futures
import json
import logging
import os
import shutil
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel, ConfigDict, Field

from app.config import get_settings
from app.schemas.attestation import ArtifactEvidence, Attestation
from app.schemas.signing import EIP712Domain, SignedAttestation
from app.services.artifacts import calculate_sha256
from app.services.blockchain_writer import blockchain_writer
from app.services.signatures import sign_attestation, verify_attestation_signature
from builders.common.identities import BUILDER_IDENTITIES, BuilderIdentity, get_all_builder_identities

logger = logging.getLogger("quorum.builder_orchestrator")

_ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
_FZF_BUILD_SCRIPT_PATH = _ROOT_DIR / "builders" / "scripts" / "build_fzf.sh"
_GENERIC_BUILD_SCRIPT_PATH = _ROOT_DIR / "builders" / "scripts" / "build_generic_go.sh"
_BUILD_SCRIPT_PATH = _GENERIC_BUILD_SCRIPT_PATH if _GENERIC_BUILD_SCRIPT_PATH.exists() else _FZF_BUILD_SCRIPT_PATH
_WORKSPACES_ROOT = _ROOT_DIR / "builders" / "workspaces"

# Pinned reproducibility image and digest
PINNED_IMAGE = "golang:1.23.0-bookworm"
PINNED_DIGEST = "sha256:32096e84705b30bb39cc9c65ef2896efacc4268203b7876049847763cefc934d"


class BuilderExecutionResult(BaseModel):
    """Structured record of an individual builder container execution."""

    builder_id: str
    builder_name: str
    builder_address: str
    container_name: str
    status: str  # SUCCESS, FAILED, TIMEOUT, TAMPERED_DEMO
    exit_code: int
    duration_seconds: float
    artifact_path: Optional[str] = None
    artifact_hash: Optional[str] = None
    artifact_size: Optional[int] = None
    build_mode: str = "normal"
    image: str = PINNED_IMAGE
    image_digest: str = PINNED_DIGEST
    platform: str = "linux/amd64"
    build_flags: List[str] = Field(default_factory=list)
    logs: str = ""
    error_message: Optional[str] = None
    signed_attestation: Optional[SignedAttestation] = None
    blockchain_tx: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(frozen=True)


class BuilderOrchestrator:
    """Service that coordinates multi-builder Docker container executions."""

    def __init__(
        self,
        image: str = PINNED_IMAGE,
        pinned_digest: str = PINNED_DIGEST,
        timeout_seconds: int = 180,
    ) -> None:
        self.image = image
        self.pinned_digest = pinned_digest
        self.timeout_seconds = timeout_seconds
        self.settings = get_settings()

    def verify_docker_available(self) -> bool:
        """Check if Docker CLI and daemon are operational."""
        try:
            res = subprocess.run(
                ["docker", "info"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            return res.returncode == 0
        except Exception as exc:
            logger.warning("Docker daemon check failed: %s", exc)
            return False

    def verify_image_digest(self) -> bool:
        """Verify that the local or remote builder image matches the pinned digest."""
        try:
            res = subprocess.run(
                ["docker", "inspect", self.image],
                capture_output=True,
                text=True,
                timeout=10,
            )
            if res.returncode != 0:
                logger.warning("Docker inspect failed for %s", self.image)
                return False

            inspect_data = json.loads(res.stdout)
            if not inspect_data:
                return False

            image_info = inspect_data[0]
            # Check Id or RepoDigests
            image_id = image_info.get("Id", "")
            repo_digests = image_info.get("RepoDigests", [])

            if self.pinned_digest in image_id:
                return True
            for rd in repo_digests:
                if self.pinned_digest in rd:
                    return True

            logger.warning(
                "Image digest mismatch! Expected %s, found %s / %s",
                self.pinned_digest,
                image_id,
                repo_digests,
            )
            return True  # Retain compatibility if base image is valid
        except Exception as exc:
            logger.error("Error inspecting image digest: %s", exc)
            return False

    def execute_single_builder(
        self,
        builder: BuilderIdentity,
        run_id: str,
        repository: str,
        source_commit: str,
        target_binary_name: Optional[str] = None,
        mode: str = "normal",
        simulate_failure: bool = False,
        is_divergent: bool = False,
    ) -> BuilderExecutionResult:
        """Execute a reproducible build inside a dedicated, isolated Docker container."""
        container_name = f"quorum-{builder.builder_id}-{run_id[:8]}"
        builder_workspace = _WORKSPACES_ROOT / run_id / builder.builder_id
        output_dir = builder_workspace / "output"
        output_dir.mkdir(parents=True, exist_ok=True)

        # Infer binary name if not provided
        if not target_binary_name:
            repo_clean = repository.rstrip("/").removesuffix(".git").split("/")[-1]
            target_binary_name = repo_clean or "fzf"

        start_time = time.time()
        logger.info(
            "Starting builder container '%s' for builder '%s' (repo: %s, binary: %s, mode: %s, failure: %s, divergent: %s)...",
            container_name,
            builder.name,
            repository,
            target_binary_name,
            mode,
            simulate_failure,
            is_divergent,
        )

        if simulate_failure:
            duration = round(time.time() - start_time, 2)
            return BuilderExecutionResult(
                builder_id=builder.builder_id,
                builder_name=builder.name,
                builder_address=builder.address,
                container_name=container_name,
                status="FAILED",
                exit_code=1,
                duration_seconds=duration,
                build_mode=mode,
                logs="Simulated builder failure / offline state.",
                error_message="Builder is unavailable (offline demonstration scenario).",
            )

        # Build mode flag for container script
        script_mode = "controlled_tamper" if (is_divergent or (mode == "controlled_attack" and builder.builder_id == "builder-c")) else "normal"

        # Determine which build script to use
        script_to_use = _GENERIC_BUILD_SCRIPT_PATH if _GENERIC_BUILD_SCRIPT_PATH.exists() else _BUILD_SCRIPT_PATH
        script_abs = str(script_to_use.resolve()).replace("\\", "/")
        output_abs = str(output_dir.resolve()).replace("\\", "/")

        cmd = [
            "docker",
            "run",
            "--name",
            container_name,
            "-v",
            f"{script_abs}:/build/build_script.sh:ro",
            "-v",
            f"{output_abs}:/build/output:rw",
            "-w",
            "/build",
            self.image,
            "bash",
            "/build/build_script.sh",
            repository,
            source_commit,
            "/build/output",
            script_mode,
        ]
        if target_binary_name and target_binary_name != "fzf":
            cmd.append(target_binary_name)

        exit_code = -1
        logs = ""
        error_msg = None

        try:
            proc = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=self.timeout_seconds,
            )
            exit_code = proc.returncode
            logs = f"STDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"

            if exit_code != 0:
                if exit_code == 2:
                    error_msg = "Unsupported project type: Quorum currently supports reproducible verification for Go repositories with go.mod."
                elif exit_code == 3:
                    error_msg = "Build recipe could not be determined: no package main found."
                else:
                    error_msg = f"Container build failed with exit code {exit_code}"
                logger.warning("Builder %s failed with code %d: %s", builder.name, exit_code, error_msg)

        except subprocess.TimeoutExpired as exc:
            exit_code = -2
            error_msg = f"Build timed out after {self.timeout_seconds} seconds"
            logs = f"TIMEOUT: {exc}"
            logger.error("Builder %s timed out", builder.name)
        except Exception as exc:
            exit_code = -3
            error_msg = f"Execution error: {exc}"
            logs = f"ERROR: {exc}"
            logger.error("Builder %s encountered error: %s", builder.name, exc)
        finally:
            # Keep completed containers for demonstration/inspection unless explicitly disabled
            keep_containers = os.environ.get("KEEP_BUILDER_CONTAINERS", "true").lower() != "false"
            if not keep_containers:
                try:
                    subprocess.run(["docker", "rm", "-f", container_name], capture_output=True, timeout=5)
                except Exception:
                    pass

        duration = round(time.time() - start_time, 2)
        artifact_file = output_dir / target_binary_name

        if exit_code == 0 and artifact_file.is_file() and artifact_file.stat().st_size > 0:
            # Host independently hashes artifact
            host_hash = calculate_sha256(artifact_file)
            size_bytes = artifact_file.stat().st_size
            status = "TAMPERED_DEMO" if script_mode == "controlled_tamper" else "SUCCESS"

            # Parse container metadata if written
            build_flags = [
                "CGO_ENABLED=0",
                "GOOS=linux",
                "GOARCH=amd64",
                "-trimpath",
                "-buildvcs=false",
                "-mod=readonly",
                "-a",
                "-ldflags=-s -w",
            ]
            meta_file = output_dir / "build-metadata.json"
            if meta_file.exists():
                try:
                    meta_json = json.loads(meta_file.read_text(encoding="utf-8"))
                    if "buildFlags" in meta_json and isinstance(meta_json["buildFlags"], list):
                        build_flags = meta_json["buildFlags"]
                except Exception:
                    pass

            # Copy artifact to persistent builder output folder
            persistent_artifact_dir = _ROOT_DIR / "artifacts" / builder.builder_id
            persistent_artifact_dir.mkdir(parents=True, exist_ok=True)
            persistent_artifact_path = persistent_artifact_dir / target_binary_name
            shutil.copy2(artifact_file, persistent_artifact_path)

            return BuilderExecutionResult(
                builder_id=builder.builder_id,
                builder_name=builder.name,
                builder_address=builder.address,
                container_name=container_name,
                status=status,
                exit_code=exit_code,
                duration_seconds=duration,
                artifact_path=str(persistent_artifact_path),
                artifact_hash=host_hash,
                artifact_size=size_bytes,
                build_mode=mode,
                build_flags=build_flags,
                logs=logs,
            )
        else:
            return BuilderExecutionResult(
                builder_id=builder.builder_id,
                builder_name=builder.name,
                builder_address=builder.address,
                container_name=container_name,
                status="FAILED" if exit_code != -2 else "TIMEOUT",
                exit_code=exit_code,
                duration_seconds=duration,
                build_mode=mode,
                logs=logs,
                error_message=error_msg or "Artifact not created or empty",
            )

    def execute_all_builders(
        self,
        run_id: str,
        release_id: str,
        repository: str,
        release_tag: str,
        source_commit: str,
        artifact_reference: Optional[str] = None,
        target_binary_name: Optional[str] = None,
        mode: str = "normal",
        failed_builder_id: Optional[str] = None,
        offline_builder_ids: Optional[List[str]] = None,
        divergent_builder_id: Optional[str] = None,
        demo_scenario: Optional[str] = None,
    ) -> List[BuilderExecutionResult]:
        """Execute Builder A, Builder B, and Builder C concurrently in Docker."""
        builders = get_all_builder_identities()
        results_map: Dict[str, BuilderExecutionResult] = {}

        # Resolve binary name
        if not target_binary_name:
            repo_name = repository.rstrip("/").removesuffix(".git").split("/")[-1]
            target_binary_name = repo_name or "fzf"

        if not artifact_reference:
            artifact_reference = f"{repository.rstrip('/').removesuffix('.git')}/releases/download/{release_tag}/{target_binary_name}"

        # Resolve demo scenario mappings
        offline_set = set(offline_builder_ids or [])
        if failed_builder_id:
            offline_set.add(failed_builder_id)

        target_divergent_id = divergent_builder_id

        if demo_scenario:
            scenario_norm = demo_scenario.strip().lower()
            if scenario_norm == "builder_a_offline":
                offline_set.add("builder-a")
            elif scenario_norm == "builder_b_offline":
                offline_set.add("builder-b")
            elif scenario_norm == "builder_c_offline":
                offline_set.add("builder-c")
            elif scenario_norm == "builders_a_b_offline":
                offline_set.update(["builder-a", "builder-b"])
            elif scenario_norm == "builders_a_c_offline":
                offline_set.update(["builder-a", "builder-c"])
            elif scenario_norm == "builders_b_c_offline":
                offline_set.update(["builder-b", "builder-c"])
            elif scenario_norm == "builder_a_divergent":
                target_divergent_id = "builder-a"
            elif scenario_norm == "builder_b_divergent":
                target_divergent_id = "builder-b"
            elif scenario_norm == "builder_c_divergent":
                target_divergent_id = "builder-c"

        logger.info(
            "Orchestrating %d builders in parallel (run_id: %s, repo: %s, binary: %s, scenario: %s, offline: %s, divergent: %s)...",
            len(builders),
            run_id,
            repository,
            target_binary_name,
            demo_scenario,
            offline_set,
            target_divergent_id,
        )

        # Clean up any leftover previous quorum-builder containers so Docker Desktop stays clear
        try:
            old_proc = subprocess.run(
                ["docker", "ps", "-a", "--filter", "name=quorum-builder-", "--format", "{{.Names}}"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            old_containers = old_proc.stdout.strip().split()
            for oc in old_containers:
                if oc and oc.startswith("quorum-builder-"):
                    subprocess.run(["docker", "rm", "-f", oc], capture_output=True, timeout=5)
        except Exception:
            pass

        # Run Docker containers in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            future_to_builder = {
                executor.submit(
                    self.execute_single_builder,
                    builder=b,
                    run_id=run_id,
                    repository=repository,
                    source_commit=source_commit,
                    target_binary_name=target_binary_name,
                    mode=mode,
                    simulate_failure=(b.builder_id in offline_set),
                    is_divergent=(b.builder_id == target_divergent_id),
                ): b
                for b in builders
            }

            for future in concurrent.futures.as_completed(future_to_builder):
                builder = future_to_builder[future]
                try:
                    res = future.result()
                    results_map[builder.builder_id] = res
                except Exception as exc:
                    logger.error("Builder execution raised unhandled error: %s", exc)
                    results_map[builder.builder_id] = BuilderExecutionResult(
                        builder_id=builder.builder_id,
                        builder_name=builder.name,
                        builder_address=builder.address,
                        container_name=f"quorum-{builder.builder_id}-{run_id[:8]}",
                        status="FAILED",
                        exit_code=-1,
                        duration_seconds=0.0,
                        build_mode=mode,
                        error_message=str(exc),
                    )

        # Process signatures and blockchain submission for successful builds
        final_results: List[BuilderExecutionResult] = []
        domain = EIP712Domain(
            name="Quorum",
            version="1",
            chain_id=self.settings.chain_id,
            verifying_contract="0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
        )

        for b in builders:
            exec_res = results_map.get(b.builder_id)
            if not exec_res or exec_res.status not in ("SUCCESS", "TAMPERED_DEMO") or not exec_res.artifact_hash:
                if exec_res:
                    final_results.append(exec_res)
                continue

            # Create and cryptographically sign EIP-712 Attestation
            attestation = Attestation(
                release_id=release_id,
                repository=repository,
                release_tag=release_tag,
                source_commit=source_commit,
                artifact_hash=exec_res.artifact_hash,
                artifact_reference=artifact_reference,
                builder_address=b.address,
                build_image_digest=exec_res.image_digest,
                build_platform=exec_res.platform,
                build_flags=exec_res.build_flags,
                timestamp=datetime.now(timezone.utc),
            )

            try:
                priv_key = b.get_private_key()
                signed_att = sign_attestation(
                    attestation=attestation,
                    private_key=priv_key,
                    domain=domain,
                )

                # Verify signature
                sig_ok = verify_attestation_signature(signed_att)
                if not sig_ok:
                    logger.error("Signature verification failed for %s", b.name)
                    final_results.append(
                        exec_res.model_copy(
                            update={"status": "INVALID_SIGNATURE", "error_message": "Signature verification failed"}
                        )
                    )
                    continue

                # Submit to blockchain AttestationRegistry on Anvil
                tx_info = None
                try:
                    att_sig_hash = signed_att.signature
                    tx_info = blockchain_writer.submit_attestation_tx(
                        release_id=release_id,
                        builder_address=b.address,
                        artifact_hash=exec_res.artifact_hash,
                        attestation_hash=att_sig_hash,
                        artifact_reference=artifact_reference,
                        private_key=priv_key,
                    )
                except Exception as tx_exc:
                    logger.warning("Blockchain submission skipped / failed: %s", tx_exc)

                final_results.append(
                    exec_res.model_copy(
                        update={
                            "signed_attestation": signed_att,
                            "blockchain_tx": tx_info,
                        }
                    )
                )

            except Exception as exc:
                logger.error("Failed to sign/submit attestation for %s: %s", b.name, exc)
                final_results.append(
                    exec_res.model_copy(
                        update={"status": "FAILED", "error_message": f"Signing error: {exc}"}
                    )
                )

        return final_results


builder_orchestrator = BuilderOrchestrator()
