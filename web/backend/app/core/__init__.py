"""
Kinex Backend — Core Module Init
"""

from .settings import settings
from .logger import get_logger, recognition_logger, api_logger, error_logger
from .exceptions import (
    KinexException,
    ModelNotFoundError,
    ModelNotLoadedError,
    InvalidFrameDataError,
    BackendUnavailableError,
    InferenceTimeoutError,
)

__all__ = [
    "settings",
    "get_logger",
    "recognition_logger",
    "api_logger",
    "error_logger",
    "KinexException",
    "ModelNotFoundError",
    "ModelNotLoadedError",
    "InvalidFrameDataError",
    "BackendUnavailableError",
    "InferenceTimeoutError",
]
