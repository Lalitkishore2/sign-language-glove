"""
Kinex Backend — Prediction Request/Response Schemas

Defines the Pydantic models for the /predict endpoint.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class PredictRequest(BaseModel):
    """
    Prediction request payload.
    
    The frontend sends a temporal buffer of normalized landmark frames.
    Shape semantics: [frames, landmarks * channels]
    
    For MediaPipe Hands (21 landmarks, 2 channels x/y):
        frames: list of lists, each inner list has 42 float values.
    
    For MediaPipe Hands with z (21 landmarks, 3 channels x/y/z):
        frames: list of lists, each inner list has 63 float values.
    """

    frames: List[List[float]] = Field(
        ...,
        description="Temporal frame buffer. Each frame is a flattened landmark vector.",
        min_length=1,
    )
    num_hands: int = Field(
        default=1,
        ge=1,
        le=2,
        description="Number of hands detected (1 or 2).",
    )
    source: str = Field(
        default="mediapipe",
        description="Feature source identifier (mediapipe, smart_glove, etc.).",
    )
    timestamp_ms: Optional[float] = Field(
        default=None,
        description="Client-side timestamp in milliseconds for synchronization.",
    )


class PredictionResult(BaseModel):
    """Single prediction output from the recognition engine."""

    gloss: str = Field(..., description="Predicted ISL gloss/sign label.")
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Prediction confidence score."
    )
    rank: int = Field(default=0, ge=0, description="Rank in top-k predictions.")


class PredictResponse(BaseModel):
    """Response payload from the /predict endpoint."""

    predictions: List[PredictionResult] = Field(
        default_factory=list,
        description="Top-k prediction results sorted by confidence.",
    )
    model_name: Optional[str] = Field(
        default=None, description="Name of the model used for inference."
    )
    inference_time_ms: float = Field(
        default=0.0, description="Time taken for inference in milliseconds."
    )
    status: str = Field(
        default="success",
        description="Inference status: success, no_model, error.",
    )
    message: Optional[str] = Field(
        default=None, description="Human-readable status message."
    )
