"""Quorum Consumer Verifier Package.

Independently inspects blockchain evidence, verifies EIP-712 cryptographic signatures,
applies local consumer trust policy, and computes deterministic quorum verdicts.
"""

import sys
from pathlib import Path

# Ensure backend package is accessible for shared schemas/services without code duplication
_ROOT_DIR = Path(__file__).resolve().parent.parent.parent
_BACKEND_DIR = _ROOT_DIR / "backend"
_VERIFIER_DIR = _ROOT_DIR / "verifier"

if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))
if str(_VERIFIER_DIR) not in sys.path:
    sys.path.insert(0, str(_VERIFIER_DIR))

__version__ = "0.1.0"
