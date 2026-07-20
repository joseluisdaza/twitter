import json
import os
from typing import Any

import joblib

MODEL_PATH = os.getenv("TOXICITY_MODEL_PATH", "model/toxicity_model.pkl")
THRESHOLD = float(os.getenv("TOXICITY_THRESHOLD", "0.5"))

_model_cache: Any = None


def _load_model() -> Any:
    global _model_cache
    if _model_cache is None:
        _model_cache = joblib.load(MODEL_PATH)
    return _model_cache


def handler(event, _context):
    text = (event or {}).get("text", "")
    if not isinstance(text, str) or not text.strip():
        return {
            "toxicityScore": 0.0,
            "isToxic": False,
            "error": "Text is required",
        }

    model = _load_model()
    probability = float(model.predict_proba([text])[0][1])

    return {
        "toxicityScore": round(probability, 4),
        "isToxic": probability >= THRESHOLD,
    }
