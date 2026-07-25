"""
Kinex Backend — Recognition Service

Orchestrates the full server-side recognition flow:
1. Receives normalized landmark frames from the frontend
2. Validates tensor shapes
3. Delegates inference to ModelService
4. Applies server-side prediction stabilization
5. Returns ranked predictions

This service contains NO OpenHands-specific imports.
All vendor communication goes through ModelService.
"""

import time
from collections import deque
from typing import List, Dict, Any, Optional

from ..core import settings, recognition_logger, ModelNotLoadedError, InvalidFrameDataError
from ..schemas.predict import PredictRequest, PredictResponse, PredictionResult
from .model_service import model_service


class RecognitionMetrics:
    """Tracks recognition performance metrics."""

    def __init__(self, window_size: int = 100):
        self._latencies: deque = deque(maxlen=window_size)
        self._confidences: deque = deque(maxlen=window_size)
        self._total_predictions: int = 0
        self._start_time: float = time.time()

    def record_inference(self, latency_ms: float, confidence: float):
        self._latencies.append(latency_ms)
        self._confidences.append(confidence)
        self._total_predictions += 1

    @property
    def avg_latency_ms(self) -> float:
        return sum(self._latencies) / len(self._latencies) if self._latencies else 0.0

    @property
    def avg_confidence(self) -> float:
        return sum(self._confidences) / len(self._confidences) if self._confidences else 0.0

    @property
    def fps(self) -> float:
        elapsed = time.time() - self._start_time
        return self._total_predictions / elapsed if elapsed > 0 else 0.0

    @property
    def total_predictions(self) -> int:
        return self._total_predictions

    @property
    def uptime_seconds(self) -> float:
        return time.time() - self._start_time


class RecognitionService:
    """
    Handles the recognition pipeline on the server side.
    
    Responsibilities:
    - Validate incoming frame data shapes
    - Delegate inference to the ModelService adapter
    - Track metrics (latency, confidence, FPS)
    - Apply server-side duplicate suppression
    """

    def __init__(self):
        self.metrics = RecognitionMetrics()
        self._last_prediction: Optional[str] = None
        self._last_prediction_time: float = 0.0
        recognition_logger.info("RecognitionService initialized")

    def predict(self, request: PredictRequest) -> PredictResponse:
        """
        Process a prediction request.
        
        Args:
            request: PredictRequest with buffered landmark frames.
            
        Returns:
            PredictResponse with ranked predictions or status message.
        """
        start = time.perf_counter()

        # Validate frame data
        num_frames = len(request.frames)
        if num_frames < 1:
            raise InvalidFrameDataError(
                expected="at least 1 frame",
                received=f"{num_frames} frames",
            )

        # INCLUDE Transformer accepts up to 256 frames (max_position_embeddings)
        max_frames = 256
        if num_frames > max_frames:
            raise InvalidFrameDataError(
                expected=f"at most {max_frames} frames",
                received=f"{num_frames} frames",
            )

        # Validate feature dimension (134 = 50 pose + 42 left hand + 42 right hand)
        if request.frames and len(request.frames[0]) != 134:
            raise InvalidFrameDataError(
                expected="134 features per frame (50 pose + 42 left hand + 42 right hand)",
                received=f"{len(request.frames[0])} features per frame",
            )

        # Check if a model is loaded
        if not model_service.is_loaded:
            return PredictResponse(
                predictions=[],
                model_name=None,
                inference_time_ms=0.0,
                status="no_model",
                message="Recognition Model Not Installed",
            )

        # Attempt inference via the model service adapter
        try:
            raw_predictions = model_service.predict(request.frames)
            inference_time = (time.perf_counter() - start) * 1000

            # Build ranked predictions
            predictions = []
            for i, pred in enumerate(raw_predictions):
                predictions.append(
                    PredictionResult(
                        gloss=pred["gloss"],
                        confidence=pred["confidence"],
                        rank=i,
                    )
                )

            # Apply duplicate suppression
            top_confidence = predictions[0].confidence if predictions else 0.0
            top_gloss = predictions[0].gloss if predictions else ""

            # Check cooldown
            now = time.time()
            cooldown_s = settings.recognition.duplicate_suppression_cooldown_ms / 1000
            if (
                top_gloss == self._last_prediction
                and (now - self._last_prediction_time) < cooldown_s
            ):
                recognition_logger.debug(f"Duplicate suppressed: {top_gloss}")
                return PredictResponse(
                    predictions=[],
                    model_name=model_service.active_model_name,
                    inference_time_ms=inference_time,
                    status="suppressed",
                    message="Duplicate prediction suppressed by cooldown.",
                )

            # Record metrics
            self.metrics.record_inference(inference_time, top_confidence)
            self._last_prediction = top_gloss
            self._last_prediction_time = now

            return PredictResponse(
                predictions=predictions,
                model_name=model_service.active_model_name,
                inference_time_ms=inference_time,
                status="success",
            )

        except ModelNotLoadedError:
            return PredictResponse(
                predictions=[],
                model_name=None,
                inference_time_ms=0.0,
                status="no_model",
                message="Recognition Model Not Installed",
            )
        except Exception as e:
            recognition_logger.error(f"Inference error: {e}")
            inference_time = (time.perf_counter() - start) * 1000
            return PredictResponse(
                predictions=[],
                model_name=model_service.active_model_name,
                inference_time_ms=inference_time,
                status="error",
                message=str(e),
            )

    def get_metrics(self) -> Dict[str, Any]:
        """Return current recognition metrics."""
        return {
            "fps": round(self.metrics.fps, 2),
            "avg_inference_latency_ms": round(self.metrics.avg_latency_ms, 2),
            "total_predictions": self.metrics.total_predictions,
            "avg_confidence": round(self.metrics.avg_confidence, 4),
            "model_loaded": model_service.is_loaded,
            "uptime_seconds": round(self.metrics.uptime_seconds, 1),
        }


# Singleton
recognition_service = RecognitionService()
