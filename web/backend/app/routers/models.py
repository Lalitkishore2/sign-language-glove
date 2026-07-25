"""
Kinex Backend — Models Router

GET /models — List all available recognition models in models/isl/.
"""

from fastapi import APIRouter

from ..schemas.responses import ModelsResponse, ModelInfo
from ..services import model_service

router = APIRouter(tags=["models"])


@router.get("/models", response_model=ModelsResponse)
async def list_models() -> ModelsResponse:
    """
    Discover and list all compatible model checkpoints
    found in the models/isl/ directory.
    """
    available = model_service.discover_models()
    models = [
        ModelInfo(
            name=m["name"],
            path=m["path"],
            size_bytes=m["size_bytes"],
            loaded=m["loaded"],
        )
        for m in available
    ]
    return ModelsResponse(
        models=models,
        active_model=model_service.active_model_name,
    )
