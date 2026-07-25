"""
Kinex Backend — FastAPI Application Entry Point

Starts the Kinex recognition backend with all routers mounted.
Uses the AI4Bharat INCLUDE Transformer for ISL recognition.
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core import settings, api_logger
from app.routers import (
    recognition_router,
    health_router,
    models_router,
    version_router,
    metrics_router,
)
from app.services import model_service


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.kinex.name,
        version=settings.kinex.version,
        description=(
            "Kinex ISL Recognition Backend — "
            "A FastAPI service using the AI4Bharat INCLUDE Transformer "
            "for real-time Indian Sign Language recognition."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.server.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount routers
    app.include_router(recognition_router)
    app.include_router(health_router)
    app.include_router(models_router)
    app.include_router(version_router)
    app.include_router(metrics_router)

    @app.on_event("startup")
    async def on_startup():
        api_logger.info(f"Kinex Backend v{settings.kinex.version} starting...")
        api_logger.info(f"Engine: {model_service.openhands_version}")

        # Attempt to auto-load the INCLUDE Transformer
        available = model_service.discover_models()
        if available:
            try:
                model_service.load_model()
                api_logger.info(f"Model loaded: {model_service.active_model_name}")
            except Exception as e:
                api_logger.warning(f"Auto-load failed: {e}. Continuing without model.")
        else:
            api_logger.info(
                "No models found in models/isl/. "
                "Place a checkpoint file to enable recognition."
            )

    @app.on_event("shutdown")
    async def on_shutdown():
        api_logger.info("Kinex Backend shutting down...")
        model_service.unload_model()

    return app


app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.server.host,
        port=settings.server.port,
        workers=settings.server.workers,
        reload=False,
        log_level=settings.logging.level.lower(),
    )
