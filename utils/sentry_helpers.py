"""
BlackWayConnect - Sentry Helpers
Utilitaires de monitoring et tracing pour tous les modules.
"""

import sentry_sdk
import functools
from typing import Callable


def set_module_tag(module: str, action: str):
    """Set Sentry tags pour le module courant."""
    sentry_sdk.set_tag("module", module)
    sentry_sdk.set_tag("action", action)


def track_module(module_name: str):
    """
    Décorateur pour tracer les appels de module dans Sentry.
    Ajoute automatiquement les breadcrumbs et tags.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            sentry_sdk.set_tag("module", module_name)
            sentry_sdk.set_tag("function", func.__name__)
            sentry_sdk.add_breadcrumb(
                category=module_name,
                message=f"{module_name}.{func.__name__} called",
                level="info",
            )
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                sentry_sdk.capture_exception(e)
                raise
        return wrapper
    return decorator
