"""Official release artifact downloader and integrity verification service."""

import hashlib
import logging
import urllib.parse
import urllib.request
from typing import Optional, Tuple

logger = logging.getLogger("quorum.official_artifact")

DEFAULT_TIMEOUT_SECONDS = 30.0
MAX_DOWNLOAD_SIZE_BYTES = 150 * 1024 * 1024  # 150 MB safety limit


class OfficialArtifactError(Exception):
    """Base exception for official artifact download and verification failures."""


def validate_artifact_url(url: str) -> bool:
    """Validate that the artifact URL is a valid HTTP/HTTPS URL."""
    if not url or not isinstance(url, str):
        return False
    parsed = urllib.parse.urlparse(url.strip())
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)


def download_and_hash_official_artifact(
    url: str,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
    max_size_bytes: int = MAX_DOWNLOAD_SIZE_BYTES,
) -> Tuple[str, int]:
    """Safely stream download an official release artifact and compute its SHA-256 hash.

    Args:
        url: Remote artifact URL (e.g. GitHub release binary asset).
        timeout: Subprocess / HTTP request timeout in seconds.
        max_size_bytes: Maximum allowed download size in bytes.

    Returns:
        Tuple of (64-character lowercase SHA-256 hash, size in bytes).

    Raises:
        OfficialArtifactError: If the download fails, times out, or exceeds size limits.
    """
    clean_url = url.strip() if isinstance(url, str) else ""
    if not validate_artifact_url(clean_url):
        raise OfficialArtifactError(f"Invalid artifact URL: '{url}'. Must be a valid HTTP or HTTPS URL.")

    logger.info("Downloading official artifact for hash comparison: %s", clean_url)
    hasher = hashlib.sha256()
    total_bytes = 0

    req = urllib.request.Request(
        clean_url,
        headers={"User-Agent": "Quorum-Verification-Engine/1.0"},
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            if response.status not in (200, 206):
                raise OfficialArtifactError(f"Remote server returned HTTP status {response.status}")

            while True:
                chunk = response.read(65536)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > max_size_bytes:
                    raise OfficialArtifactError(
                        f"Official artifact exceeds maximum allowed size limit ({max_size_bytes // (1024*1024)} MB)"
                    )
                hasher.update(chunk)

    except urllib.error.HTTPError as http_err:
        logger.warning("HTTP error downloading official artifact: %s", http_err)
        raise OfficialArtifactError(f"Failed to download official artifact (HTTP {http_err.code}): {http_err.reason}")
    except urllib.error.URLError as url_err:
        logger.warning("URL error downloading official artifact: %s", url_err)
        raise OfficialArtifactError(f"Network error downloading official artifact: {url_err.reason}")
    except TimeoutError:
        logger.warning("Timeout downloading official artifact: %s", clean_url)
        raise OfficialArtifactError(f"Download timed out after {timeout} seconds")
    except OfficialArtifactError:
        raise
    except Exception as exc:
        logger.error("Unexpected error downloading official artifact: %s", exc)
        raise OfficialArtifactError(f"Unexpected error downloading official artifact: {exc}")

    artifact_hash = hasher.hexdigest().lower()
    logger.info("Official artifact downloaded successfully: %d bytes, SHA-256: %s", total_bytes, artifact_hash)
    return artifact_hash, total_bytes
