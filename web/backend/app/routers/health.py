"""
Kinex Backend — Health Router

POST /health — Basic health check confirming the backend is alive.
"""

from fastapi import APIRouter

from ..schemas.responses import HealthResponse
from ..services import model_service

router = APIRouter(tags=["health"])


@router.post("/health", response_model=HealthResponse)
@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Basic health check. Returns alive status and model load state."""
    return HealthResponse(
        status="ok",
        model_loaded=model_service.is_loaded,
    )
