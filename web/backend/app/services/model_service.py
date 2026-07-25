"""
Kinex Backend — Model Service (INCLUDE Transformer)

Manages the INCLUDE Transformer model lifecycle:
- Loads TransformerConfig(size="large") with 263 ISL classes
- Loads include_no_cnn_transformer_large.pth checkpoint
- Runs inference on temporal landmark sequences
- Returns ranked top-k predictions with confidence scores

This service is the ONLY component that communicates with
the INCLUDE model. All other services go through this adapter.
"""

import gc
import json
import sys
import time
from pathlib import Path
from typing import Optional, List, Dict, Any

from ..core import settings, recognition_logger, ModelNotFoundError, ModelNotLoadedError

# Resolve paths relative to the backend root
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
_MODELS_DIR = _BACKEND_ROOT / settings.recognition.model_dir
_INCLUDE_DIR = _BACKEND_ROOT / "include"
_LABEL_MAP_PATH = _INCLUDE_DIR / "label_maps" / "label_map_include.json"

# Ensure the backend root and include dir are on sys.path
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))


class ModelService:
    """
    Adapter layer between Kinex and the AI4Bharat INCLUDE Transformer.

    Responsibilities:
    - Load the INCLUDE Transformer architecture with 263 output classes
    - Load the pre-trained checkpoint
    - Provide a predict() method that accepts normalized pose+hand sequences
    - Return top-k glosses with confidence scores
    """

    def __init__(self):
        self._model = None
        self._model_name: Optional[str] = None
        self._model_path: Optional[str] = None
        self._num_classes: int = 263
        self._label_map: Dict[str, int] = {}
        self._id_to_label: Dict[int, str] = {}
        self._load_time: float = 0.0
        self._is_loaded: bool = False

        self._load_label_map()
        recognition_logger.info("ModelService initialized (INCLUDE Transformer)")

    def _load_label_map(self):
        """Load the INCLUDE label map (word -> index)."""
        try:
            if _LABEL_MAP_PATH.exists():
                with open(_LABEL_MAP_PATH, "r", encoding="utf-8") as f:
                    self._label_map = json.load(f)
                # Build reverse map: index -> word
                self._id_to_label = {v: k for k, v in self._label_map.items()}
                self._num_classes = len(self._label_map)
                recognition_logger.info(
                    f"Label map loaded: {self._num_classes} classes from {_LABEL_MAP_PATH.name}"
                )
            else:
                recognition_logger.warning(f"Label map not found at {_LABEL_MAP_PATH}")
        except Exception as e:
            recognition_logger.error(f"Failed to load label map: {e}")

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

    @property
    def active_model_name(self) -> Optional[str]:
        return self._model_name

    @property
    def num_classes(self) -> int:
        return self._num_classes

    @property
    def openhands_version(self) -> str:
        """Legacy property — now returns INCLUDE version info."""
        return "INCLUDE-Transformer-v1.0"

    def discover_models(self) -> List[Dict[str, Any]]:
        """
        Scan the models/isl/ directory for compatible checkpoint files.
        Returns a list of model info dicts.
        """
        _MODELS_DIR.mkdir(parents=True, exist_ok=True)
        extensions = {".ckpt", ".pth", ".pt"}
        models = []

        for f in _MODELS_DIR.iterdir():
            if f.is_file() and f.suffix in extensions:
                models.append(
                    {
                        "name": f.stem,
                        "path": str(f.relative_to(_BACKEND_ROOT)),
                        "size_bytes": f.stat().st_size,
                        "loaded": self._model_name == f.stem,
                    }
                )

        recognition_logger.info(f"Discovered {len(models)} model(s) in {_MODELS_DIR}")
        return models

    def load_model(self, model_name: Optional[str] = None) -> bool:
        """
        Load the INCLUDE Transformer model.

        Instantiates TransformerConfig(size="large"), creates the Transformer
        with n_classes=263, and loads the checkpoint state dict.
        """
        if self._is_loaded and self._model_name == model_name:
            recognition_logger.info(f"Model '{model_name}' already loaded")
            return True

        # Unload any existing model first
        if self._is_loaded:
            self.unload_model()

        # Determine which checkpoint to load
        available = self.discover_models()
        if not available:
            recognition_logger.warning("No models found in models/isl/")
            return False

        target = None
        if model_name:
            target = next((m for m in available if m["name"] == model_name), None)
            if not target:
                raise ModelNotFoundError(str(_MODELS_DIR / model_name))
        else:
            # Prefer the INCLUDE transformer checkpoint
            target = next(
                (m for m in available if "include" in m["name"].lower()),
                available[0],
            )

        model_path = _BACKEND_ROOT / target["path"]
        recognition_logger.info(f"Loading INCLUDE Transformer from: {model_path}")

        try:
            import torch

            # Import the INCLUDE Transformer architecture
            from include.configs import TransformerConfig
            from include.models.transformer import Transformer

            start = time.perf_counter()

            # Build the model architecture
            config = TransformerConfig(size="large")
            model = Transformer(config=config, n_classes=self._num_classes)

            # Load checkpoint with weights_only=False to allow numpy scalars
            checkpoint = torch.load(str(model_path), map_location=torch.device("cpu"), weights_only=False)

            # Handle different checkpoint formats
            if isinstance(checkpoint, dict):
                if "model" in checkpoint:
                    state_dict = checkpoint["model"]
                elif "state_dict" in checkpoint:
                    state_dict = checkpoint["state_dict"]
                elif "model_state_dict" in checkpoint:
                    state_dict = checkpoint["model_state_dict"]
                else:
                    state_dict = checkpoint
            else:
                state_dict = checkpoint

            # Load state dict into model
            result = model.load_state_dict(state_dict, strict=True)
            recognition_logger.info(f"load_state_dict result: {result}")

            # Switch to eval mode — critical for inference
            model.eval()

            self._model = model
            self._model_name = target["name"]
            self._model_path = str(model_path)
            self._is_loaded = True
            self._load_time = (time.perf_counter() - start) * 1000

            recognition_logger.info(
                f"INCLUDE Transformer '{self._model_name}' loaded in {self._load_time:.1f}ms "
                f"({self._num_classes} classes, config=large)"
            )
            return True

        except ImportError as e:
            recognition_logger.error(f"Missing dependency for INCLUDE Transformer: {e}")
            return False
        except RuntimeError as e:
            recognition_logger.error(f"Checkpoint state_dict mismatch: {e}")
            return False
        except Exception as e:
            recognition_logger.error(f"Failed to load model: {e}")
            return False

    def unload_model(self):
        """Unload the current model and free memory."""
        if self._model is not None:
            del self._model
            self._model = None
            self._model_name = None
            self._model_path = None
            self._is_loaded = False
            gc.collect()

            try:
                import torch
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
            except ImportError:
                pass

            recognition_logger.info("Model unloaded and memory freed")

    def predict(self, frames: List[List[float]], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Run inference on a sequence of normalized landmark frames.

        Args:
            frames: List of frames, each frame is a list of 134 floats
                    (50 pose + 42 left hand + 42 right hand).
            top_k: Number of top predictions to return.

        Returns:
            List of prediction dicts with 'gloss' and 'confidence'.
        """
        if not self._is_loaded or self._model is None:
            raise ModelNotLoadedError()

        try:
            import torch
            import torch.nn.functional as F

            # Convert frames to tensor: shape [1, num_frames, 134]
            tensor = torch.tensor([frames], dtype=torch.float32)

            # Run inference with no gradient computation
            with torch.no_grad():
                logits = self._model(tensor)  # shape [1, 263]

            # Apply softmax to get probabilities
            probs = F.softmax(logits, dim=-1)
            top_probs, top_indices = torch.topk(probs[0], min(top_k, self._num_classes))

            predictions = []
            for prob, idx in zip(top_probs.tolist(), top_indices.tolist()):
                gloss = self._id_to_label.get(idx, f"class_{idx}")
                predictions.append({
                    "gloss": gloss,
                    "confidence": round(prob, 4),
                })

            return predictions

        except Exception as e:
            recognition_logger.error(f"Inference error: {e}")
            raise

    def get_status(self) -> Dict[str, Any]:
        """Return current model service status."""
        return {
            "model_loaded": self._is_loaded,
            "model_name": self._model_name,
            "model_path": self._model_path,
            "num_classes": self._num_classes,
            "architecture": "INCLUDE Transformer Large",
            "load_time_ms": self._load_time,
        }


# Singleton instance
model_service = ModelService()
