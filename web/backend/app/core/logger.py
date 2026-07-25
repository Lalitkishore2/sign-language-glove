"""
Kinex Backend — Structured Logging

Provides named loggers writing to separate log files for
recognition events, API access, and errors.
"""

import logging
import sys
from pathlib import Path
from typing import Optional

from .settings import settings


_LOG_DIR = Path(__file__).resolve().parent.parent.parent / settings.logging.dir
_LOG_DIR.mkdir(parents=True, exist_ok=True)

_LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def _create_file_handler(filename: str, level: int = logging.DEBUG) -> logging.FileHandler:
    handler = logging.FileHandler(_LOG_DIR / filename, encoding="utf-8")
    handler.setLevel(level)
    handler.setFormatter(logging.Formatter(_LOG_FORMAT, datefmt=_DATE_FORMAT))
    return handler


def _create_stream_handler(level: int = logging.INFO) -> logging.StreamHandler:
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)
    handler.setFormatter(logging.Formatter(_LOG_FORMAT, datefmt=_DATE_FORMAT))
    return handler


def get_logger(name: str, log_file: Optional[str] = None) -> logging.Logger:
    """
    Get a named logger with structured file and console output.
    
    Args:
        name: Logger name (e.g., 'recognition', 'api').
        log_file: Optional log file override. Defaults to api.log.
    """
    logger = logging.getLogger(f"kinex.{name}")
    if logger.handlers:
        return logger

    level = getattr(logging, settings.logging.level.upper(), logging.INFO)
    logger.setLevel(level)

    # Console handler
    logger.addHandler(_create_stream_handler(level))

    # File handler
    file = log_file or settings.logging.api_log
    logger.addHandler(_create_file_handler(file, level))

    # Error file handler — always captures WARNING+
    logger.addHandler(_create_file_handler(settings.logging.error_log, logging.WARNING))

    logger.propagate = False
    return logger


# Pre-configured loggers
recognition_logger = get_logger("recognition", settings.logging.recognition_log)
api_logger = get_logger("api", settings.logging.api_log)
error_logger = get_logger("error", settings.logging.error_log)
