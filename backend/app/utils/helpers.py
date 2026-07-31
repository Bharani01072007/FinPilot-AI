"""Helper Utilities Module.

Provides common helper functions used across modules.
"""

import uuid


def generate_unique_id(prefix: str = "") -> str:
    """Generate a unique string ID with optional prefix.

    Args:
        prefix: Optional prefix string for the generated ID.

    Returns:
        Formatted unique ID string.
    """
    unique_str = str(uuid.uuid4())
    if prefix:
        return f"{prefix}_{unique_str}"
    return unique_str
