"""
BlackWayConnect - Logger avec intégration Sentry
"""

import sys
from loguru import logger


def setup_logger():
    """Configure le logger BlackWayConnect avec breadcrumbs Sentry."""
    logger.remove()
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <blue>[BlackWay]</blue> | <level>{level}</level> | {message}",
        level="DEBUG",
        colorize=True,
    )
    logger.add(
        "logs/blackway_{time:YYYY-MM-DD}.log",
        rotation="10 MB",
        retention="30 days",
        compression="gz",
        level="INFO",
    )
    return logger


def get_logger():
    return logger
