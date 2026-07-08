from __future__ import annotations
import nh3

# In nh3, configuration takes sets rather than lists for O(1) lookup speed.
ALLOWED_TAGS: set[str] = set()


def sanitize_text(raw: str | None) -> str:
    """
    Strip HTML/script content from untrusted public complaint text.
    Uses Rust-powered nh3 for high-throughput production sanitization.
    """
    if not raw:
        return ""

    # tags=set() removes all HTML tags while preserving the inner text payload.
    # e.g., "<script>bad()</script>Hello <b>world</b>" -> "bad()Hello world"
    cleaned = nh3.clean(raw, tags=ALLOWED_TAGS)
    
    return cleaned.strip()


def validate_coordinates(lat: float, lng: float) -> None:
    """Validate WGS84 decimal degree boundaries."""
    if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lng <= 180.0):
        from core.exceptions import ValidationError
        raise ValidationError("Invalid latitude/longitude coordinates.")
