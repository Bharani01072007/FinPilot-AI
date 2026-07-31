"""Centralized Logging Configuration Module.

Configures structured logging across the application.
"""

import logging
import sys
from app.config.settings import settings


def setup_logging() -> logging.Logger:
    """Initialize and configure global application logger."""
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

    logger = logging.getLogger("finpilot")
    logger.setLevel(log_level)
    return logger


logger = setup_logging()
