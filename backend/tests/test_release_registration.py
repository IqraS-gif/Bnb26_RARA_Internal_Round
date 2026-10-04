"""Unit and workflow tests for on-chain ReleaseRegistry integration and arbitrary release registration."""

import pytest
from unittest.mock import MagicMock, patch
from hexbytes import HexBytes

from app.services.blockchain_writer import (
    BlockchainSubmissionError,
    BlockchainWriter,
    ReleaseRegistrationConflictError,
)


def test_ensure_release_registered_already_exists_matches():
    """Test requirement: already-registered release is reused idempotently without errors."""
    writer = BlockchainWriter()

    with patch.object(writer, "is_release_registered", return_value=True), \
         patch.object(writer, "get_registered_release", return_value={
             "is_registered": True,
             "repository": "https://github.com/charmbracelet/gum.git",
             "release_tag": "v2.0.2",
             "source_commit": "879f048103adf0214b85943b52d8d65b08d772c5",
             "registered_at": 1700000000,
         }):

        res = writer.ensure_release_registered(
            release_id="gum-v2.0.2",
            repository="https://github.com/charmbracelet/gum",
            release_tag="v2.0.2",
            source_commit="879f048103adf0214b85943b52d8d65b08d772c5",
        )

        assert res["status"] == "ALREADY_REGISTERED"
        assert res["already_registered"] is True
        assert res["release_id"] == "gum-v2.0.2"


def test_ensure_release_registered_conflict_raises_error():
    """Test requirement: registration conflict with different source commit raises ReleaseRegistrationConflictError."""
    writer = BlockchainWriter()

    with patch.object(writer, "is_release_registered", return_value=True), \
         patch.object(writer, "get_registered_release", return_value={
             "is_registered": True,
             "repository": "https://github.com/charmbracelet/gum.git",
             "release_tag": "v2.0.2",
             "source_commit": "879f048103adf0214b85943b52d8d65b08d772c5",
             "registered_at": 1700000000,
         }):

        with pytest.raises(ReleaseRegistrationConflictError) as exc_info:
            writer.ensure_release_registered(
                release_id="gum-v2.0.2",
                repository="https://github.com/charmbracelet/gum",
                release_tag="v2.0.2",
                source_commit="deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
            )

        err = str(exc_info.value)
        assert "Release registration conflict" in err
        assert "gum-v2.0.2" in err


def test_ensure_release_registered_broadcasts_tx_when_new():
    """Test requirement: new arbitrary release triggers on-chain registration transaction."""
    writer = BlockchainWriter()

    mock_w3 = MagicMock()
    mock_w3.is_connected.return_value = True
    mock_w3.eth.gas_price = 1000000000
    mock_w3.eth.get_transaction_count.return_value = 5
    mock_w3.eth.send_raw_transaction.return_value = HexBytes("0xabcdef1234567890")

    mock_receipt = MagicMock()
    mock_receipt.status = 1
    mock_receipt.transactionHash = HexBytes("0xabcdef1234567890")
    mock_receipt.blockNumber = 42
    mock_receipt.gasUsed = 120000
    mock_w3.eth.wait_for_transaction_receipt.return_value = mock_receipt

    mock_contract = MagicMock()
    mock_contract.address = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    mock_build_tx = MagicMock()
    mock_build_tx.build_transaction.return_value = {"to": mock_contract.address, "data": b""}
    mock_contract.functions.registerRelease.return_value = mock_build_tx

    with patch.object(writer, "_w3", mock_w3), \
         patch.object(writer, "_get_release_contract", return_value=mock_contract), \
         patch.object(writer, "is_release_registered", side_effect=[False, True]):

        res = writer.ensure_release_registered(
            release_id="new-repo-v1.0.0",
            repository="https://github.com/example/new-repo",
            release_tag="v1.0.0",
            source_commit="a" * 40,
        )

        assert res["status"] == "REGISTERED"
        assert res["already_registered"] is False
        assert res["block_number"] == 42
        assert res["transaction_hash"] == "abcdef1234567890"


def test_ensure_release_registered_reverted_tx_raises_error():
    """Test requirement: failed/reverted transaction raises BlockchainSubmissionError."""
    writer = BlockchainWriter()

    mock_w3 = MagicMock()
    mock_w3.is_connected.return_value = True
    mock_w3.eth.gas_price = 1000000000
    mock_w3.eth.get_transaction_count.return_value = 5
    mock_w3.eth.send_raw_transaction.return_value = HexBytes("0xabcdef1234567890")

    mock_receipt = MagicMock()
    mock_receipt.status = 0  # Reverted
    mock_receipt.transactionHash = HexBytes("0xabcdef1234567890")
    mock_w3.eth.wait_for_transaction_receipt.return_value = mock_receipt

    mock_contract = MagicMock()
    mock_build_tx = MagicMock()
    mock_build_tx.build_transaction.return_value = {"to": "0x123", "data": b""}
    mock_contract.functions.registerRelease.return_value = mock_build_tx

    with patch.object(writer, "_w3", mock_w3), \
         patch.object(writer, "_get_release_contract", return_value=mock_contract), \
         patch.object(writer, "is_release_registered", return_value=False):

        with pytest.raises(BlockchainSubmissionError) as exc_info:
            writer.ensure_release_registered(
                release_id="revert-repo-v1.0.0",
                repository="https://github.com/example/revert-repo",
                release_tag="v1.0.0",
                source_commit="b" * 40,
            )

        assert "reverted" in str(exc_info.value)
