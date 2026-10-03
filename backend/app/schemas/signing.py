"""EIP-712 signed attestation schemas."""

from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.attestation import Attestation
from app.schemas.validators import validate_ethereum_address


class EIP712Domain(BaseModel):
    """EIP-712 domain separator parameters."""

    name: str = Field(
        default="Quorum",
        description="Name of the signing domain",
        examples=["Quorum"],
    )
    version: str = Field(
        default="1",
        description="Version of the signing domain",
        examples=["1"],
    )
    chain_id: int = Field(
        ...,
        description="EVM chain ID to prevent cross-network replay attacks",
        examples=[31337],
    )
    verifying_contract: Optional[str] = Field(
        default=None,
        description="Ethereum address of the verifying contract, if applicable",
        examples=["0x0000000000000000000000000000000000000000"],
    )

    model_config = ConfigDict(
        frozen=True,
        str_strip_whitespace=True,
    )

    @field_validator("verifying_contract")
    @classmethod
    def check_verifying_contract(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v != "":
            return validate_ethereum_address(v)
        return None


class SignedAttestation(BaseModel):
    """Attestation paired with its EIP-712 cryptographic signature and domain."""

    attestation: Attestation = Field(
        ...,
        description="The underlying builder attestation data payload",
    )
    signature: str = Field(
        ...,
        description="0x-prefixed 65-byte hexadecimal secp256k1 EIP-712 signature",
        examples=["0xac761f399ebd5ad13cd6adccf3ae17375b21f92981f401083374467af9fcc5810b891680dcfc51e7bddd6c21a4410dafeea152c9390060b761d5a24b0ad814ac1c"],
    )
    domain: EIP712Domain = Field(
        ...,
        description="EIP-712 domain used when producing the signature",
    )

    model_config = ConfigDict(
        frozen=True,
        str_strip_whitespace=True,
    )

    @field_validator("signature")
    @classmethod
    def check_signature(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("signature must be a string")
        cleaned = v.strip()
        if not (cleaned.startswith("0x") or cleaned.startswith("0X")):
            cleaned = "0x" + cleaned
        hex_data = cleaned[2:]
        if len(hex_data) != 130:  # 65 bytes = 130 hex chars
            raise ValueError(
                f"signature must be a 65-byte hexadecimal string (got {len(hex_data) // 2} bytes / {len(hex_data)} chars)"
            )
        try:
            int(hex_data, 16)
        except ValueError:
            raise ValueError("signature contains non-hexadecimal characters")
        return "0x" + hex_data.lower()
