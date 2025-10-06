# utils/merge_data.py
from __future__ import annotations
from typing import Dict

def merge_sources(nasa: Dict, meteo: Dict, air: Dict) -> Dict:
    """
    Unifica metadatos y provee 'snapshot' actual desde Open-Meteo, histórico desde NASA.
    """
    current = (meteo or {}).get("current", {})
    daily = (meteo or {}).get("daily", {})
    hourly_units = (meteo or {}).get("hourly_units", {})
    daily_units = (meteo or {}).get("daily_units", {})

    return {
        "current": {
            "temperature": current.get("temperature_2m"),
            "humidity": current.get("relative_humidity_2m"),
            "wind": current.get("wind_speed_10m"),
            "precipitation": current.get("precipitation"),
            "units": (meteo or {}).get("current_units", {}),
        },
        "daily_openmeteo": {
            "dates": daily.get("time", []),
            "tmax": daily.get("temperature_2m_max", []),
            "tmin": daily.get("temperature_2m_min", []),
            "precipitation": daily.get("precipitation_sum", []),
            "wind_max": daily.get("wind_speed_10m_max", []),
            "humidity": daily.get("relative_humidity_2m_mean", []),
            "units": daily_units,
        },
        "daily_nasa": {
            "dates": nasa.get("dates", []),
            "temperature": nasa.get("temperature", []),
            "humidity": nasa.get("humidity", []),
            "wind": nasa.get("wind", []),
            "precipitation": nasa.get("precipitation", []),
            "avg": nasa.get("avg", {}),
        },
        "air_quality_index": air,
        "sources": [
            nasa.get("source", {"name": "NASA POWER"}),
            {"name": "Open-Meteo"},
            {"name": air.get("source", "WAQI")},
        ]
    }
