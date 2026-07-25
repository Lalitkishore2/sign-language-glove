"""Kinex Backend — Routers Package Init"""

from .recognition import router as recognition_router
from .health import router as health_router
from .models import router as models_router
from .version import router as version_router
from .metrics import router as metrics_router

__all__ = [
    "recognition_router",
    "health_router",
    "models_router",
    "version_router",
    "metrics_router",
]
