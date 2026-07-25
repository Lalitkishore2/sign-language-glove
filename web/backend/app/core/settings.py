"""
Kinex Backend — Application Settings

Loads and validates all configuration from config.yaml.
Provides typed access to every configuration section.
"""

import os
import yaml
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Optional


_CONFIG_DIR = Path(__file__).resolve().parent.parent / "config"
_CONFIG_FILE = _CONFIG_DIR / "config.yaml"


@dataclass
class RecognitionConfig:
    model_dir: str = "models/isl"
    default_model: Optional[str] = None
    confidence_threshold: float = 0.65
    frame_buffer_size: int = 16
    max_frame_buffer_size: int = 32
    temporal_smoothing_window: int = 5
    duplicate_suppression_cooldown_ms: int = 500
    gesture_cooldown_ms: int = 300


@dataclass
class MediaPipeConfig:
    max_num_hands: int = 2
    min_detection_confidence: float = 0.5
    min_tracking_confidence: float = 0.5
    model_asset_path: Optional[str] = None


@dataclass
class CameraResolution:
    width: int = 640
    height: int = 480


@dataclass
class CameraConfig:
    target_fps: int = 30
    resolution: CameraResolution = field(default_factory=CameraResolution)


@dataclass
class ServerConfig:
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: List[str] = field(
        default_factory=lambda: ["http://localhost:5173", "http://localhost:3000"]
    )
    workers: int = 1


@dataclass
class LoggingConfig:
    level: str = "INFO"
    dir: str = "logs"
    recognition_log: str = "recognition.log"
    api_log: str = "api.log"
    error_log: str = "error.log"


@dataclass
class GeminiConfig:
    model: str = "gemini-1.5-flash"
    api_key_env: str = "GEMINI_API_KEY"
    timeout_seconds: float = 5.0
    max_retries: int = 3


@dataclass
class BluetoothConfig:
    enabled: bool = False
    scan_duration_seconds: int = 10


@dataclass
class KinexConfig:
    version: str = "1.0.0"
    name: str = "Kinex ISL Recognition Platform"


@dataclass
class AppSettings:
    kinex: KinexConfig = field(default_factory=KinexConfig)
    recognition: RecognitionConfig = field(default_factory=RecognitionConfig)
    mediapipe: MediaPipeConfig = field(default_factory=MediaPipeConfig)
    camera: CameraConfig = field(default_factory=CameraConfig)
    server: ServerConfig = field(default_factory=ServerConfig)
    logging: LoggingConfig = field(default_factory=LoggingConfig)
    gemini: GeminiConfig = field(default_factory=GeminiConfig)
    bluetooth: BluetoothConfig = field(default_factory=BluetoothConfig)


def _dict_to_dataclass(cls, data: dict):
    """Recursively convert a dict into a dataclass instance."""
    if data is None:
        return cls()
    fieldtypes = {f.name: f.type for f in cls.__dataclass_fields__.values()}
    kwargs = {}
    for key, value in data.items():
        if key in fieldtypes:
            ft = fieldtypes[key]
            # Check if the field type is itself a dataclass
            if isinstance(value, dict) and hasattr(ft, "__dataclass_fields__"):
                kwargs[key] = _dict_to_dataclass(ft, value)
            else:
                kwargs[key] = value
    return cls(**kwargs)


def load_settings(config_path: Optional[str] = None) -> AppSettings:
    """Load application settings from YAML configuration file."""
    path = Path(config_path) if config_path else _CONFIG_FILE
    if not path.exists():
        return AppSettings()

    with open(path, "r", encoding="utf-8") as f:
        raw = yaml.safe_load(f) or {}

    settings = AppSettings(
        kinex=_dict_to_dataclass(KinexConfig, raw.get("kinex")),
        recognition=_dict_to_dataclass(RecognitionConfig, raw.get("recognition")),
        mediapipe=_dict_to_dataclass(MediaPipeConfig, raw.get("mediapipe")),
        camera=_dict_to_dataclass(CameraConfig, raw.get("camera")),
        server=_dict_to_dataclass(ServerConfig, raw.get("server")),
        logging=_dict_to_dataclass(LoggingConfig, raw.get("logging")),
        gemini=_dict_to_dataclass(GeminiConfig, raw.get("gemini")),
        bluetooth=_dict_to_dataclass(BluetoothConfig, raw.get("bluetooth")),
    )
    return settings


# Singleton instance
settings = load_settings()
