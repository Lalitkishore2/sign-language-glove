"""
Kinex Backend — Recognition Router

POST /predict — Accept buffered landmark sequences and return predictions.
"""

from fastapi import APIRouter, HTTPException

from ..schemas.predict import PredictRequest, PredictResponse
from ..schemas.responses import ErrorResponse
from ..services import recognition_service
from ..core import api_logger, InvalidFrameDataError

router = APIRouter(tags=["recognition"])


@router.post(
    "/predict",
    response_model=PredictResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid frame data"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def predict(request: PredictRequest) -> PredictResponse:
    """
    Process a buffered sequence of normalized landmark frames.
    
    The frontend sends a temporal buffer (default 16 frames) of
    flattened landmark vectors. The backend validates the shape,
    delegates inference to the OpenHands adapter, and returns
    ranked predictions with confidence scores.
    
    If no model is loaded, returns status="no_model" with the
    message "Recognition Model Not Installed".
    """
    api_logger.info(
        f"POST /predict — {len(request.frames)} frames, "
        f"source={request.source}, hands={request.num_hands}"
    )

    try:
        response = recognition_service.predict(request)
        return response
    except InvalidFrameDataError as e:
        api_logger.warning(f"Invalid frame data: {e.message}")
        raise HTTPException(status_code=400, detail=e.message)
    except Exception as e:
        api_logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
