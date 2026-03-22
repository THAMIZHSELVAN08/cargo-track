"""
Iron Fist - AI Anomaly Detection Microservice
Built with FastAPI + Scikit-learn (Isolation Forest)

Detects:
- Route deviation (speed=0 for too long = long stop)
- Unusually high speed
- Location pattern anomalies via Isolation Forest
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import numpy as np
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("iron-fist-ai")

app = FastAPI(
    title="Iron Fist AI Service",
    description="Anomaly detection microservice for GPS telemetry data",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic Schemas ────────────────────────────────────────────────────────────
class GPSData(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    speed: float = Field(..., ge=0)
    container_id: str
    timestamp: Optional[str] = None

class BatchRequest(BaseModel):
    data: List[GPSData]

class AnomalyResult(BaseModel):
    status: str        # "NORMAL" or "ANOMALY"
    reason: str
    score: float       # 0.0 (normal) to 1.0 (highly anomalous)
    container_id: str

# ── Rule-Based Anomaly Detector ──────────────────────────────────────────────────
# (Used as fallback if sklearn is not available or for interpretable alerts)

# Thresholds — adjust for your domain
MAX_SPEED_KMH = 120       # Any speed above this is anomalous
LONG_STOP_SPEED = 2       # Below this = considered stopped
GEOFENCE_LAT_MIN = 12.5   # Rough bounding box (expand to actual route)
GEOFENCE_LAT_MAX = 13.5
GEOFENCE_LNG_MIN = 77.0
GEOFENCE_LNG_MAX = 78.5

def rule_based_detect(data: GPSData) -> AnomalyResult:
    """
    Fast, interpretable anomaly detection using domain rules.
    Returns ANOMALY with a specific reason if any rule is violated.
    """
    reasons = []
    score = 0.0

    # Rule 1: Overspeed
    if data.speed > MAX_SPEED_KMH:
        reasons.append(f"Speed {data.speed:.1f} km/h exceeds limit {MAX_SPEED_KMH} km/h")
        score = max(score, min(1.0, (data.speed - MAX_SPEED_KMH) / MAX_SPEED_KMH))

    # Rule 2: Vehicle stopped (very low speed) — could be a long stop
    if data.speed < LONG_STOP_SPEED and data.speed >= 0:
        reasons.append(f"Vehicle appears stationary (speed={data.speed:.1f} km/h)")
        score = max(score, 0.4)

    # Rule 3: Out of expected geographic bounding box
    lat_out = not (GEOFENCE_LAT_MIN <= data.lat <= GEOFENCE_LAT_MAX)
    lng_out = not (GEOFENCE_LNG_MIN <= data.lng <= GEOFENCE_LNG_MAX)
    if lat_out or lng_out:
        reasons.append(f"Location ({data.lat:.4f}, {data.lng:.4f}) outside expected route corridor")
        score = max(score, 0.85)

    if reasons:
        return AnomalyResult(**{
            "status": "ANOMALY",
            "reason": "; ".join(reasons),
            "score": float(score),
            "container_id": data.container_id,
        })

    return AnomalyResult(**{
        "status": "NORMAL",
        "reason": "All parameters within normal range",
        "score": 0.0,
        "container_id": data.container_id,
    })


# ── Isolation Forest Detector ───────────────────────────────────────────────────
# Try to use sklearn Isolation Forest; fall back to rule-based if unavailable

try:
    from sklearn.ensemble import IsolationForest
    import joblib
    import os

    MODEL_PATH = "model/isolation_forest.pkl"

    def get_or_train_model():
        """Load a pre-trained model or train a new one with synthetic normal data."""
        if os.path.exists(MODEL_PATH):
            logger.info("Loading pre-trained Isolation Forest model")
            return joblib.load(MODEL_PATH)

        logger.info("Training Isolation Forest model with synthetic baseline data")
        # Synthetic normal baseline: vehicles moving at 30–80 km/h within geofence
        np.random.seed(42)
        n = 500
        normal_data = np.column_stack([
            np.random.uniform(GEOFENCE_LAT_MIN + 0.1, GEOFENCE_LAT_MAX - 0.1, n),  # lat
            np.random.uniform(GEOFENCE_LNG_MIN + 0.1, GEOFENCE_LNG_MAX - 0.1, n),  # lng
            np.random.uniform(30, 80, n),  # speed
        ])

        model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
        model.fit(normal_data)

        os.makedirs("model", exist_ok=True)
        joblib.dump(model, MODEL_PATH)
        logger.info(f"Model trained and saved to {MODEL_PATH}")
        return model

    _model = get_or_train_model()
    SKLEARN_AVAILABLE = True

except ImportError:
    logger.warning("sklearn not available — using rule-based detection only")
    SKLEARN_AVAILABLE = False
    _model = None


def ml_detect(data: GPSData) -> AnomalyResult:
    """
    Isolation Forest anomaly detection.
    Returns prediction score and combines with rule-based findings.
    """
    import typing
    model = typing.cast(typing.Any, _model)
    if model is None or not SKLEARN_AVAILABLE:
        return rule_based_detect(data)

    features = np.array([[data.lat, data.lng, data.speed]])
    prediction = model.predict(features)[0]       # -1 = anomaly, 1 = normal
    raw_score = model.score_samples(features)[0]  # More negative = more anomalous

    # Normalize score to [0, 1] range (approximate)
    normalized_score = max(0.0, min(1.0, 1.0 - (raw_score + 0.5)))

    # Still run rules for interpretable reason strings
    rule_result = rule_based_detect(data)

    if prediction == -1:
        reason = rule_result.reason if rule_result.status == "ANOMALY" else "Unusual GPS pattern detected by AI model"
        return AnomalyResult(**{
            "status": "ANOMALY",
            "reason": reason,
            "score": float(max(normalized_score, rule_result.score)),
            "container_id": data.container_id,
        })

    return AnomalyResult(**{
        "status": "NORMAL",
        "reason": "All parameters within normal range",
        "score": float(normalized_score),
        "container_id": data.container_id,
    })


# ── API Endpoints ──────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "OK",
        "service": "Iron Fist AI",
        "model": "IsolationForest" if SKLEARN_AVAILABLE else "RuleBased",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/analyze", response_model=AnomalyResult)
async def analyze(data: GPSData):
    """Analyze a single GPS data point for anomalies."""
    try:
        result = ml_detect(data)
        logger.info(f"[{data.container_id}] {result.status} — {result.reason} (score={result.score})")
        return result
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze/batch")
async def analyze_batch(request: BatchRequest):
    """Analyze a batch of GPS data points."""
    results = []
    for point in request.data:
        try:
            result = ml_detect(point)
            results.append(result.dict())
        except Exception as e:
            results.append({
                "status": "ERROR",
                "reason": str(e),
                "score": 0,
                "container_id": point.container_id,
            })
    return {"results": results, "total": len(results)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
