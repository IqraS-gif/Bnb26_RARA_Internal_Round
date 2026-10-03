"""Quorum Backend Application Package."""

import sys
from pathlib import Path

# Ensure verifier package and project root are accessible
_ROOT_DIR = Path(__file__).resolve().parent.parent.parent
_VERIFIER_DIR = _ROOT_DIR / "verifier"
_BACKEND_DIR = _ROOT_DIR / "backend"

if str(_VERIFIER_DIR) not in sys.path:
    sys.path.insert(0, str(_VERIFIER_DIR))
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))
if str(_ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(_ROOT_DIR))
