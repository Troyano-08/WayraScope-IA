# ai/compare.py
from __future__ import annotations
from typing import Dict, List, Optional
from utils.safe_math import trend_symbol, safe_mean

def compare_trends(series: Dict[str, List[Optional[float]]]) -> Dict[str, str]:
    """
    Espera llaves: temperature, precipitation, humidity, wind (listas diarias).
    Retorna símbolos y texto amigable.
    """
    out = {}
    mapping = {
        "temperature": "Temperatura",
        "precipitation": "Precipitación",
        "humidity": "Humedad",
        "wind": "Viento"
    }
    for k, label in mapping.items():
        vals = series.get(k, [])
        out[k] = trend_symbol(vals)
    return out

def average_snapshot(series: Dict[str, List[Optional[float]]]) -> Dict[str, Optional[float]]:
    return {k: safe_mean(v, default=None) for k, v in series.items()}
