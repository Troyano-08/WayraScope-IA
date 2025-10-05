# externals/geocoding_api.py
from __future__ import annotations
import requests
from typing import Dict

def get_coordinates(city: str) -> Dict:
    url = "https://geocoding-api.open-meteo.com/v1/search"
    params = {"name": city, "count": 1, "language": "es", "format": "json"}
    r = requests.get(url, params=params, timeout=12)
    r.raise_for_status()
    data = r.json()
    if not data.get("results"):
        raise ValueError(f"No se encontraron coordenadas para '{city}'.")
    res = data["results"][0]
    return {
        "name": res.get("name"),
        "country": res.get("country"),
        "lat": res.get("latitude"),
        "lon": res.get("longitude"),
    }
