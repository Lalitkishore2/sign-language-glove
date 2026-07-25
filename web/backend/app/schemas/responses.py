"""
Kinex Backend — General Response Schemas

Defines Pydantic models for health, version, metrics, and model list endpoints.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class HealthResponse(BaseModel):
    """Response from the /health endpoint."""

    status: str = Field(default="ok", description="Health status.")
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat(),
        description="UTC timestamp.",
    )
    model_loaded: bool = Field(
        default=False, description="Whether a recognition model is loaded."
    )


class VersionResponse(BaseModel):
    """Response from the /version endpoint."""

    kinex_version: str = Field(..., description="Kinex platform version.")
    openhands_version: str = Field(..., description="Vendored OpenHands version.")
    loaded_model: Optional[str] = Field(
        default=None, description="Currently loaded model name."
    )
    recognition_provider: str = Field(
        default="openhands", description="Active recognition provider."
    )
    status: str = Field(default="ok", description="Overall system status.")


class ModelInfo(BaseModel):
    """Information about a single available model."""

    name: str = Field(..., description="Model filename.")
    path: str = Field(..., description="Relative path to the model file.")
    size_bytes: int = Field(default=0, description="File size in bytes.")
    loaded: bool = Field(default=False, description="Whether this model is active.")


class ModelsResponse(BaseModel):
    """Response from the /models endpoint."""

    models: List[ModelInfo] = Field(
        default_factory=list, description="Available models."
    )
    active_model: Optional[str] = Field(
        default=None, description="Currently active model name."
    )


class MetricsResponse(BaseModel):
    """Response from the /metrics endpoint."""

    fps: float = Field(default=0.0, description="Current processing FPS.")
    avg_inference_latency_ms: float = Field(
        default=0.0, description="Average inference latency."
    )
    total_predictions: int = Field(
        default=0, description="Total predictions made since startup."
    )
    queue_size: int = Field(default=0, description="Current inference queue size.")
    buffer_utilization: float = Field(
        default=0.0, description="Frame buffer utilization (0-1)."
    )
    avg_confidence: float = Field(
        default=0.0, description="Rolling average confidence."
    )
    model_loaded: bool = Field(default=False, description="Model load status.")
    memory_usage_mb: float = Field(
        default=0.0, description="Estimated memory usage in MB."
    )
    uptime_seconds: float = Field(
        default=0.0, description="Server uptime in seconds."
    )


class ErrorResponse(BaseModel):
    """Standard error response."""

    error: str = Field(..., description="Error type.")
    message: str = Field(..., description="Human-readable error message.")
    detail: Optional[Dict[str, Any]] = Field(
        default=None, description="Additional error context."
    )
