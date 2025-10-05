# main.py
from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import Optional, Dict

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from utils.data_quality import series_quality
from externals.geocoding_api import get_coordinates
from externals.openmeteo_api import get_openmeteo, get_hourly_weather
from externals.waqi_api import get_air_quality
from nasa.power_api import get_power_data
from externals.weather_api import get_hourly_weather
from utils.merge_data import merge_sources
from ai.comfort import compute_comfort
from ai.ecoimpact import compute_ecoimpact
from ai.compare import compare_trends
from ai.wayrabot import wayrabot_advice, find_best_days

app = FastAPI(title="WayraScope AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

class AnalyzeInput(BaseModel):
    city: str = Field(..., example="Huánuco")
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", example="2025-10-05")
    event_type: Optional[str] = Field(default="viaje", example="viaje")

def _range_10(date_str: str) -> tuple[str, str]:
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    s = (dt - timedelta(days=10)).strftime("%Y-%m-%d")
    e = (dt + timedelta(days=10)).strftime("%Y-%m-%d")
    return s, e

@app.get("/")
def root():
    return {"ok": True, "name": "WayraScope AI", "docs": "/docs"}

@app.get("/weather/hourly")
def weather_hourly(lat: float = Query(...), lon: float = Query(...), date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$")):
    try:
        data = get_hourly_weather(lat, lon, date)
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error al obtener horario: {e}")

@app.post("/analyze")
def analyze(payload: AnalyzeInput):
    try:
        # 1) Geocoding
        loc = get_coordinates(payload.city)
        lat, lon = loc["lat"], loc["lon"]

        # 2) Rango ±10 días
        start, end = _range_10(payload.date)

        # 3) NASA POWER (histórico)
        nasa = get_power_data(lat, lon, start, end)

        # 4) Open-Meteo (actual + daily)
        meteo = get_openmeteo(lat, lon)

        # 5) WAQI (AQI)
        air = get_air_quality(lat, lon)

        # 6) Merge
        merged = merge_sources(nasa, meteo, air)

        # 7) Cálculos de confort / eco
        current = merged["current"]
        comfort = compute_comfort(current.get("temperature"), current.get("humidity"), current.get("wind"))
        eco = compute_ecoimpact(current.get("temperature"), current.get("precipitation"), merged["air_quality_index"])

        # 8) Tendencias NASA
        trends = compare_trends({
            "temperature": merged["daily_nasa"]["temperature"],
            "precipitation": merged["daily_nasa"]["precipitation"],
            "humidity": merged["daily_nasa"]["humidity"],
            "wind": merged["daily_nasa"]["wind"]
        })

        # 9) Mejores días (usa NASA, que es diario)
        best_days = find_best_days(
            payload.event_type,
            dates=[_fmt_out(d) for d in merged["daily_nasa"]["dates"]],
            temperature=merged["daily_nasa"]["temperature"],
            precipitation=merged["daily_nasa"]["precipitation"],
            wind=merged["daily_nasa"]["wind"],
            humidity=merged["daily_nasa"]["humidity"],
        )

        # 10) WayraBot Advisor
        advisor = wayrabot_advice(payload.event_type, comfort, eco, trends, best_days)

        # 11) Salida consistente con tu payload
        out = {
            "location": {"city": loc["name"], "country": loc["country"], "lat": lat, "lon": lon},
            "range": f"{start.replace('-', '')} a {end.replace('-', '')}",
            "temperature": merged["daily_nasa"]["temperature"],
            "humidity": merged["daily_nasa"]["humidity"],
            "precipitation": merged["daily_nasa"]["precipitation"],
            "wind": merged["daily_nasa"]["wind"],
            "air_quality_index": merged["air_quality_index"],
            "comfort_index": comfort,
            "eco_impact": eco,
            "trend": trends,
            "wayra_advisor": advisor,
            "best_days": best_days,  # [{date, score, notes}]
            "sources": [s["name"] if isinstance(s, dict) else s for s in merged["sources"]],
            "meta": {
                "units": {
                    "temperature": "°C (NASA T2M)",
                    "humidity": "% (NASA RH2M)",
                    "wind": "m/s (NASA WS2M)",
                    "precipitation": "mm/día (NASA PRECTOTCORR)"
                },
                "data_quality": {
                    "nasa": {
                        "temperature": series_quality(merged["daily_nasa"]["temperature"]),
                        "humidity": series_quality(merged["daily_nasa"]["humidity"]),
                        "wind": series_quality(merged["daily_nasa"]["wind"]),
                        "precipitation": series_quality(merged["daily_nasa"]["precipitation"]),
                    }
                },
                "notes": [
                    "Los días sin dato de NASA (futuros o no disponibles) se excluyen del ranking de mejores días."
                ]
            }
        }
            
        return out

    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error en /analyze: {e}")

def _fmt_out(yyyymmdd: str) -> str:
    if "-" in yyyymmdd: return yyyymmdd
    return f"{yyyymmdd[0:4]}-{yyyymmdd[4:6]}-{yyyymmdd[6:8]}"
