"""Command line interface for Quorum consumer verifier."""

from pathlib import Path
from typing import Optional
import typer
from rich.console import Console

from quorum.artifacts import compute_local_artifact_hash
from quorum.blockchain import BlockchainReader
from quorum.policy import load_trust_policy
from quorum.quorum_engine import QuorumEngine
from quorum.verdicts import VerificationStatus

app = typer.Typer(
    name="quorum",
    help="Quorum decentralized reproducible-build consumer verification CLI.",
    add_completion=False,
)
console = Console()


@app.callback()
def main_callback():
    """Quorum consumer-side blockchain evidence and quorum verification tool."""
    pass


@app.command(name="verify")
def verify_command(
    release_id: str = typer.Option(
        ...,
        "--release-id",
        "-r",
        help="Unique identifier of the software release (e.g. fzf-v0.74.4)",
    ),
    repository: Optional[str] = typer.Option(
        None,
        "--repository",
        help="Canonical upstream repository URL (e.g. https://github.com/junegunn/fzf.git)",
    ),
    tag: Optional[str] = typer.Option(
        None,
        "--tag",
        "-t",
        help="Upstream release tag (e.g. v0.74.4)",
    ),
    commit: Optional[str] = typer.Option(
        None,
        "--commit",
        "-c",
        help="Pinned source commit SHA",
    ),
    artifact_path: Optional[Path] = typer.Option(
        None,
        "--artifact-path",
        "-a",
        help="Path to local software artifact binary to verify hash against quorum",
    ),
    expected_hash: Optional[str] = typer.Option(
        None,
        "--expected-hash",
        help="Expected SHA-256 artifact hash",
    ),
    policy_path: Optional[Path] = typer.Option(
        None,
        "--policy-path",
        "-p",
        help="Path to consumer trusted-builders.json policy file",
    ),
    rpc_url: str = typer.Option(
        "http://127.0.0.1:8545",
        "--rpc-url",
        help="Ethereum JSON-RPC node URL",
    ),
    verify_upstream: bool = typer.Option(
        False,
        "--verify-upstream",
        help="Verify Git tag commit resolution against remote repository",
    ),
) -> None:
    """Independently verify blockchain evidence against local consumer trust policy."""
    # 1. Compute local artifact hash if path provided
    target_expected_hash = expected_hash
    if artifact_path:
        if not artifact_path.is_file():
            console.print(f"[red]Error: Artifact file not found at: {artifact_path}[/red]")
            raise typer.Exit(code=1)
        try:
            computed = compute_local_artifact_hash(artifact_path)
            target_expected_hash = computed
        except Exception as exc:
            console.print(f"[red]Error computing artifact hash: {exc}[/red]")
            raise typer.Exit(code=1)

    # 2. Load policy
    try:
        policy = load_trust_policy(policy_path)
    except Exception as exc:
        console.print(f"[red]Error loading trust policy: {exc}[/red]")
        raise typer.Exit(code=1)

    # 3. Connect to blockchain
    try:
        reader = BlockchainReader(rpc_url=rpc_url)
    except Exception as exc:
        console.print(f"[red]Error connecting to blockchain RPC ({rpc_url}): {exc}[/red]")
        raise typer.Exit(code=1)

    # 4. Execute verification engine
    engine = QuorumEngine(blockchain_reader=reader, policy=policy)
    result = engine.verify(
        release_id=release_id,
        repository=repository,
        release_tag=tag,
        source_commit=commit,
        expected_artifact_hash=target_expected_hash,
        verify_upstream=verify_upstream,
    )

    # 5. Format factual, evidence-oriented report
    print("QUORUM VERIFICATION")
    print("-------------------")
    print(f"Release: {result.release_id}")
    if result.repository:
        print(f"Repository: {result.repository}")
    if result.release_tag:
        print(f"Tag: {result.release_tag}")
    if result.source_commit:
        short_commit = result.source_commit[:8] + "..." if len(result.source_commit) > 12 else result.source_commit
        print(f"Commit: {short_commit}")

    print("\nPolicy:")
    print(f"  Required quorum: {result.required_quorum}")
    print(f"  Trusted builders: {result.trusted_builder_count}")

    print("\nBuilders:")
    for b in result.builders:
        name_display = b.builder_name or f"Builder ({b.builder_address[:6]}...{b.builder_address[-4:]})"
        hash_disp = f"  hash={b.artifact_hash[:8]}..." if b.artifact_hash else ""
        print(f"  {name_display:<12} {b.policy_status:<8} {b.status.value:<12}{hash_disp}")

    print("\nResult:")
    print(f"  {result.status.value}")

    print("\nReason:")
    for line in result.explanation.splitlines():
        print(f"  {line}")

    if target_expected_hash and result.quorum_artifact_hash:
        print(f"\nArtifact Hash Comparison:")
        print(f"  Target Artifact Hash: {target_expected_hash}")
        print(f"  Agreed Quorum Hash:   {result.quorum_artifact_hash}")
        if result.status != VerificationStatus.REJECT:
            print("  Match: Exact SHA-256 match confirmed.")

    print("-------------------")

    # Exit with code 0 on ACCEPT or ACCEPT_WITH_WARNING; 1 on REJECT
    if result.status == VerificationStatus.REJECT:
        raise typer.Exit(code=1)


def main():
    app()


if __name__ == "__main__":
    main()
