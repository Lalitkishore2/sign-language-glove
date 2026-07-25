"""
Kinex Backend — Version Router

GET /version — System version information.
"""

from fastapi import APIRouter

from ..schemas.responses import VersionResponse
from ..services import model_service
from ..core import settings

router = APIRouter(tags=["version"])


@router.get("/version", response_model=VersionResponse)
async def version() -> VersionResponse:
    """
    Returns Kinex version, OpenHands version, loaded model,
    recognition provider, and overall status.
    """
    return VersionResponse(
        kinex_version=settings.kinex.version,
        openhands_version=model_service.openhands_version,
        loaded_model=model_service.active_model_name,
        recognition_provider="openhands",
        status="ok" if model_service.is_loaded else "no_model",
    )
