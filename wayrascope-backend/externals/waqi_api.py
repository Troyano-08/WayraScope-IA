# externals/waqi_api.py
from __future__ import annotations
import os
import requests
from typing import Dict, Optional

def get_air_quality(lat: float, lon: float) -> Dict:
    token = os.getenv("WAQI_TOKEN", "demo")
    url = f"https://api.waqi.info/feed/geo:{lat};{lon}/"
    params = {"token": token}
    try:
        r = requests.get(url, params=params, timeout=12)
        r.raise_for_status()
        data = r.json()
        if data.get("status") != "ok":
            return {"aqi": None, "category": "Desconocida", "dominant_pollutant": None, "source": "WAQI"}
        iaqi = data.get("data", {})
        aqi = iaqi.get("aqi")
        dom = iaqi.get("dominentpol") or iaqi.get("dominent_pol")
        return {"aqi": aqi, "category": _aqi_category(aqi) if isinstance(aqi, int) else "Desconocida",
                "dominant_pollutant": dom, "source": "WAQI"}
    except Exception:
        return {"aqi": None, "category": "Desconocida", "dominant_pollutant": None, "source": "WAQI"}

def _aqi_category(aqi:int) -> str:
    if aqi is None: return "Desconocida"
    if aqi <= 50: return "Buena"
    if aqi <= 100: return "Moderada"
    if aqi <= 150: return "Dañina a sensibles"
    if aqi <= 200: return "Dañina"
    if aqi <= 300: return "Muy dañina"
    return "Peligrosa"
