"""Tests for Go toolchain parsing, version selection, and builder evidence recording."""

import pytest
from app.services.go_toolchain import (
    DEFAULT_GO_TOOLCHAIN,
    SUPPORTED_GO_TOOLCHAINS,
    MalformedGoModError,
    PinnedGoToolchain,
    UnsupportedGoVersionError,
    parse_go_mod,
    parse_semver,
    select_compatible_toolchain,
)
from app.services.builder_orchestrator import BuilderExecutionResult, BuilderOrchestrator
from builders.common.identities import get_builder_identity


def test_parse_semver_variations():
    """Test parsing standard, short, and prefixed Go versions."""
    assert parse_semver("1.23") == (1, 23, 0)
    assert parse_semver("1.23.0") == (1, 23, 0)
    assert parse_semver("go1.26.7") == (1, 26, 7)
    assert parse_semver("v1.22.4") == (1, 22, 4)
    assert parse_semver("1.24.1") == (1, 24, 1)


def test_parse_go_mod_fzf_style():
    """Test requirement: fzf-style Go 1.23 project parsing."""
    fzf_go_mod = """
module github.com/junegunn/fzf

go 1.23.0

require (
    github.com/mattn/go-isatty v0.0.20
)
"""
    go_ver, toolchain, semver = parse_go_mod(fzf_go_mod)
    assert go_ver == "1.23.0"
    assert toolchain is None
    assert semver == (1, 23, 0)

    selected = select_compatible_toolchain(fzf_go_mod)
    assert selected.name == "go1.23.0"
    assert selected.image == "golang:1.23.0-bookworm"
    assert "32096e84705b" in selected.image_digest


def test_parse_go_mod_gum_style_gte_1_26_7():
    """Test requirement: gum-style Go >=1.26.7 project parsing and toolchain selection."""
    gum_go_mod = """
module charm.land/gum/v2

go 1.26.7

require (
    charm.land/bubbles/v2 v2.1.1
    charm.land/bubbletea/v2 v2.0.10
)
"""
    go_ver, toolchain, semver = parse_go_mod(gum_go_mod)
    assert go_ver == "1.26.7"
    assert semver == (1, 26, 7)

    selected = select_compatible_toolchain(gum_go_mod)
    assert selected.name == "go1.26.7"
    assert selected.image == "golang:1.26.7-bookworm"
    assert "e8c859f5632d" in selected.image_digest


def test_parse_go_mod_with_toolchain_directive():
    """Test go.mod containing a toolchain directive higher than the go directive."""
    go_mod = """
module example.com/app

go 1.21

toolchain go1.26.7
"""
    go_ver, toolchain, semver = parse_go_mod(go_mod)
    assert go_ver == "1.21"
    assert toolchain == "1.26.7"
    assert semver == (1, 26, 7)

    selected = select_compatible_toolchain(go_mod)
    assert selected.name == "go1.26.7"
    assert selected.image == "golang:1.26.7-bookworm"


def test_unsupported_go_version_raises_structured_error():
    """Test requirement: unsupported Go version fails with clear structured error."""
    unsupported_go_mod = """
module example.com/future-app

go 1.30.0
"""
    with pytest.raises(UnsupportedGoVersionError) as exc_info:
        select_compatible_toolchain(unsupported_go_mod)

    err_msg = str(exc_info.value)
    assert "UNSUPPORTED_GO_VERSION" in err_msg
    assert "1.30.0" in err_msg
    assert "1.23.0" in err_msg
    assert "1.26.7" in err_msg


def test_malformed_or_missing_go_mod_raises_error():
    """Test requirement: malformed/missing go.mod raises MalformedGoModError."""
    with pytest.raises(MalformedGoModError):
        select_compatible_toolchain("")

    with pytest.raises(MalformedGoModError):
        select_compatible_toolchain("   \n\t  ")

    no_go_directive = """
module example.com/invalid
// Missing go directive
require github.com/foo/bar v1.0.0
"""
    with pytest.raises(MalformedGoModError):
        select_compatible_toolchain(no_go_directive)


def test_builder_evidence_records_selected_image_and_version(tmp_path):
    """Test requirement: selected image and digest are recorded in builder execution evidence."""
    from unittest.mock import MagicMock, patch

    orch = BuilderOrchestrator()
    builder = get_builder_identity("builder-a")

    gum_toolchain = SUPPORTED_GO_TOOLCHAINS[1]  # go1.26.7

    with patch("subprocess.run") as mock_run:
        mock_proc = MagicMock()
        mock_proc.returncode = 0
        mock_proc.stdout = "STDOUT"
        mock_proc.stderr = ""
        mock_run.return_value = mock_proc

        from app.services.builder_orchestrator import _WORKSPACES_ROOT
        workspace_out = _WORKSPACES_ROOT / "gum-evidence-test" / "builder-a" / "output"
        workspace_out.mkdir(parents=True, exist_ok=True)
        (workspace_out / "gum").write_bytes(b"GUM_REPRODUCIBLE_BINARY")
        (workspace_out / "build-metadata.json").write_text(
            '{"goVersion": "go1.26.7", "buildFlags": ["GOTOOLCHAIN=local", "-trimpath"]}',
            encoding="utf-8"
        )

        res = orch.execute_single_builder(
            builder=builder,
            run_id="gum-evidence-test",
            repository="https://github.com/charmbracelet/gum.git",
            source_commit="879f048103adf0214b85943b52d8d65b08d772c5",
            target_binary_name="gum",
            image=gum_toolchain.image,
            image_digest=gum_toolchain.image_digest,
        )

        assert res.status == "SUCCESS"
        assert res.image == "golang:1.26.7-bookworm"
        assert res.image_digest == gum_toolchain.image_digest
        assert res.go_version == "go1.26.7"
        assert "GOTOOLCHAIN=local" in res.build_flags
