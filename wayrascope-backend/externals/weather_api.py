# externals/weather_api.py
from __future__ import annotations
import requests
from typing import Dict

def get_hourly_weather(lat: float, lon: float, date: str) -> Dict:
    """
    Devuelve series por hora para el día indicado usando Open-Meteo.
    Unidades:
      - temperatura: °C
      - humedad: %
      - viento: m/s
      - precipitación: mm/h
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
