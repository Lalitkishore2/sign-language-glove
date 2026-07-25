"""
Kinex Backend — Metrics Router

GET /metrics — Runtime performance metrics.
"""

import os
import psutil
from fastapi import APIRouter

from ..schemas.responses import MetricsResponse
from ..services import recognition_service, model_service

router = APIRouter(tags=["metrics"])


def _get_memory_usage_mb() -> float:
    """Get current process memory usage in MB."""
    try:
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / (1024 * 1024)
    except Exception:
        return 0.0


@router.get("/metrics", response_model=MetricsResponse)
async def metrics() -> MetricsResponse:
    """
    Returns runtime performance metrics:
    FPS, latency, queue size, buffer utilization,
    confidence, model status, and memory usage.
    """
    m = recognition_service.get_metrics()
    return MetricsResponse(
        fps=m["fps"],
        avg_inference_latency_ms=m["avg_inference_latency_ms"],
        total_predictions=m["total_predictions"],
        queue_size=0,  # Managed on the frontend side via InferenceQueue
        buffer_utilization=0.0,  # Managed on the frontend side via FrameBuffer
        avg_confidence=m["avg_confidence"],
        model_loaded=m["model_loaded"],
        memory_usage_mb=round(_get_memory_usage_mb(), 2),
        uptime_seconds=m["uptime_seconds"],
    )
