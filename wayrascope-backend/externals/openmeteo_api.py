# externals/openmeteo_api.py
from __future__ import annotations
import requests
from typing import Dict, List

def get_openmeteo(lat: float, lon: float) -> Dict:
    """
    Condiciones actuales + diario (máx/mín, precip acumulada).
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
        "timezone": "auto",
        "wind_speed_unit": "ms",
    }
    r = requests.get(url, params=params, timeout=15)
    r.raise_for_status()
    return r.json()

def get_hourly_weather(lat: float, lon: float, date: str) -> Dict:
    """
    Series por hora reales para el día solicitado.
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
        "start_date": date,
        "end_date": date,
        "timezone": "auto",
        "wind_speed_unit": "ms",
    }
    r = requests.get(url, params=params, timeout=20)
    r.raise_for_status()
    data = r.json()
    hourly = data.get("hourly", {})
    return {
        "date": date,
        "time": hourly.get("time", []),
        "temperature": hourly.get("temperature_2m", []),
        "humidity": hourly.get("relative_humidity_2m", []),
        "wind": hourly.get("wind_speed_10m", []),
        "precipitation": hourly.get("precipitation", []),
        "source": {"name": "Open-Meteo", "units": data.get("hourly_units", {})},
    }
