# ai/ecoimpact.py
from __future__ import annotations
from utils.safe_math import val

def compute_ecoimpact(temp_c, precip_mm, air_quality: dict | None):
    """
    Integra precipitación y AQI; pequeño texto amigable.
    """
    t = val(temp_c, 24.0)
    p = val(precip_mm, 0.0)
    aqi = None
    category = None
    pollutant = None

    if isinstance(air_quality, dict):
        aqi = air_quality.get("aqi")
        category = air_quality.get("category")
        pollutant = air_quality.get("dominant_pollutant")

    # Clasificación simple por precipitación
    if p is None:
        p_tag = "lluvia desconocida"
    elif p < 1.0:
        p_tag = "lluvia baja"
    elif p < 5.0:
        p_tag = "lluvia moderada"
    else:
        p_tag = "lluvia alta"

    # AQI
    if aqi is None:
        aqi_text = "AQI: s/d"
        aq_cat = "Desconocida"
    else:
        aq_cat = category or _aqi_category(aqi)
        aqi_text = f"AQI: {aqi} ({aq_cat})"

    # Impacto general (más lluvia + peor AQI => mayor impacto)
    impact_score = 0
    if p is not None:
        impact_score += 0 if p < 1 else (1 if p < 5 else 2)
    if aqi is not None:
        if aqi <= 50: impact_score += 0
        elif aqi <= 100: impact_score += 1
        elif aqi <= 150: impact_score += 2
        else: impact_score += 3

    if impact_score <= 1:
        head = "Bajo impacto 🌱"
    elif impact_score <= 3:
        head = "Impacto medio 🌿"
    else:
        head = "Alto impacto ⚠️"

    pol = f", dominante: {pollutant}" if pollutant else ""
    return f"{head} — {p_tag}. {aqi_text}{pol}"

def _aqi_category(aqi:int) -> str:
    if aqi <= 50: return "Buena"
    if aqi <= 100: return "Moderada"
    if aqi <= 150: return "Dañina a sensibles"
    if aqi <= 200: return "Dañina"
    if aqi <= 300: return "Muy dañina"
    return "Peligrosa"
