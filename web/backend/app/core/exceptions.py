"""
Kinex Backend — Custom Exceptions

Defines structured exception types for the recognition pipeline
and API error handling.
"""

from typing import Optional, Any


class KinexException(Exception):
    """Base exception for all Kinex backend errors."""

    def __init__(self, message: str, detail: Optional[Any] = None):
        self.message = message
        self.detail = detail
        super().__init__(self.message)


class ModelNotFoundError(KinexException):
    """Raised when the requested recognition model cannot be found."""

    def __init__(self, model_path: str):
        super().__init__(
            message=f"Recognition model not found at: {model_path}",
            detail={"model_path": model_path},
        )


class ModelNotLoadedError(KinexException):
    """Raised when inference is attempted without a loaded model."""

    def __init__(self):
        super().__init__(
            message="Recognition Model Not Installed",
            detail={"status": "no_model"},
        )


class InvalidFrameDataError(KinexException):
    """Raised when the incoming frame data has unexpected shape or type."""

    def __init__(self, expected: str, received: str):
        super().__init__(
            message=f"Invalid frame data. Expected {expected}, received {received}.",
            detail={"expected": expected, "received": received},
        )


class BackendUnavailableError(KinexException):
    """Raised when the recognition backend is in an unhealthy state."""

    def __init__(self, reason: str = "unknown"):
        super().__init__(
            message=f"Recognition backend unavailable: {reason}",
            detail={"reason": reason},
        )


class InferenceTimeoutError(KinexException):
    """Raised when inference exceeds the allowed time budget."""

    def __init__(self, timeout_ms: float):
        super().__init__(
            message=f"Inference exceeded timeout of {timeout_ms}ms",
            detail={"timeout_ms": timeout_ms},
        )
