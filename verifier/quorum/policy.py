"""Consumer trust policy module.

Loads and enforces the consumer's local trusted-builders.json configuration.
CRITICAL TRUST BOUNDARY:
- Trust policy is defined locally by the software consumer.
- Trust is NOT determined by the blockchain or the contract owner.
- Contract owner registration does NOT grant automatic trust.
"""

import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Union

_ROOT_DIR = Path(__file__).resolve().parent.parent.parent
_VENV_PACKAGES = _ROOT_DIR / ".venv" / "Lib" / "site-packages"
if _VENV_PACKAGES.is_dir() and str(_VENV_PACKAGES) not in sys.path:
    sys.path.insert(0, str(_VENV_PACKAGES))

from eth_utils import is_address, to_checksum_address
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class PolicyValidationError(ValueError):
    """Raised when consumer trust policy is invalid or malformed."""


class TrustPolicy(BaseModel):
    """Consumer local trust policy model."""

    quorum: int = Field(
        ...,
        description="Minimum number of agreeing trusted builders required to accept a release",
        ge=1,
    )
    trusted_builders: List[str] = Field(
        ...,
        alias="trustedBuilders",
        description="List of Ethereum addresses of builders trusted by this consumer",
    )

    model_config = ConfigDict(
        frozen=True,
        populate_by_name=True,
        str_strip_whitespace=True,
    )

    @field_validator("trusted_builders")
    @classmethod
    def validate_and_checksum_builders(cls, v: List[str]) -> List[str]:
        if not isinstance(v, list):
            raise PolicyValidationError("trustedBuilders must be a list of Ethereum addresses")
        
        if len(v) == 0:
            raise PolicyValidationError("trustedBuilders list cannot be empty")

        normalized: List[str] = []
        seen: Set[str] = set()
        for idx, addr in enumerate(v):
            if not isinstance(addr, str):
                raise PolicyValidationError(f"Builder address at index {idx} must be a string")
            cleaned = addr.strip()
            if not is_address(cleaned):
                raise PolicyValidationError(
                    f"Invalid Ethereum address in trustedBuilders at index {idx}: '{addr}'"
                )
            checksummed = to_checksum_address(cleaned)
            if checksummed in seen:
                # Deduplicate or retain unique order
                continue
            seen.add(checksummed)
            normalized.append(checksummed)

        if len(normalized) == 0:
            raise PolicyValidationError("trustedBuilders list contains no valid addresses")

        return normalized

    @model_validator(mode="after")
    def validate_quorum_bounds(self) -> "TrustPolicy":
        if self.quorum < 1:
            raise PolicyValidationError(f"Quorum threshold must be >= 1, got {self.quorum}")
        if self.quorum > len(self.trusted_builders):
            raise PolicyValidationError(
                f"Quorum threshold ({self.quorum}) cannot exceed number of trusted builders ({len(self.trusted_builders)})"
            )
        return self

    @property
    def required_quorum(self) -> int:
        """Returns the required quorum threshold."""
        return self.quorum

    @property
    def trusted_builder_count(self) -> int:
        """Returns the number of trusted builders."""
        return len(self.trusted_builders)

    def is_trusted_builder(self, address: Optional[str]) -> bool:
        """Check whether a given Ethereum address is in the consumer's trusted builders list.

        Args:
            address: Ethereum address to check.

        Returns:
            True if address is valid and trusted; False otherwise.
        """
        if not address or not isinstance(address, str):
            return False
        cleaned = address.strip()
        if not is_address(cleaned):
            return False
        try:
            chk = to_checksum_address(cleaned)
            return chk in self.trusted_builders
        except Exception:
            return False


def load_trust_policy(
    source: Optional[Union[str, Path, Dict[str, Any]]] = None
) -> TrustPolicy:
    """Load and validate consumer trust policy from file, dict, or default path.

    Args:
        source: Optional file path (str or Path), dictionary, or JSON string.
                If None, loads default 'verifier/trusted-builders.json'.

    Returns:
        Validated immutable TrustPolicy instance.

    Raises:
        PolicyValidationError: If policy file is missing, invalid JSON, or violates schema rules.
    """
    if source is None:
        default_path = Path(__file__).resolve().parent.parent / "trusted-builders.json"
        if not default_path.is_file():
            raise PolicyValidationError(
                f"Default trusted builders policy file not found at: {default_path}"
            )
        source = default_path

    if isinstance(source, (str, Path)):
        p = Path(source)
        if p.is_file():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except json.JSONDecodeError as exc:
                raise PolicyValidationError(f"Invalid JSON in policy file '{p}': {exc}")
            except Exception as exc:
                raise PolicyValidationError(f"Failed to read policy file '{p}': {exc}")
        else:
            # Try parsing as JSON string directly if it looks like JSON
            s_str = str(source).strip()
            if s_str.startswith("{") and s_str.endswith("}"):
                try:
                    data = json.loads(s_str)
                except json.JSONDecodeError as exc:
                    raise PolicyValidationError(f"Invalid JSON string in policy: {exc}")
            else:
                raise PolicyValidationError(f"Policy file not found: '{source}'")
    elif isinstance(source, dict):
        data = source
    else:
        raise PolicyValidationError(f"Unsupported policy source type: {type(source)}")

    try:
        return TrustPolicy.model_validate(data)
    except PolicyValidationError:
        raise
    except Exception as exc:
        raise PolicyValidationError(f"Trust policy validation error: {exc}")
