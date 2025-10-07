# ai/ecoimpact.py
from __future__ import annotations
from utils.safe_math import val

PRECIP_TRANSLATIONS = {
    "unknown": {"es": "lluvia desconocida", "en": "rain unknown"},
    "low": {"es": "lluvia baja", "en": "low rain"},
    "moderate": {"es": "lluvia moderada", "en": "moderate rain"},
    "high": {"es": "lluvia alta", "en": "heavy rain"},
}

IMPACT_TRANSLATIONS = {
    "low": {"es": "Bajo impacto 🌱", "en": "Low impact 🌱"},
    "medium": {"es": "Impacto medio 🌿", "en": "Medium impact 🌿"},
    "high": {"es": "Alto impacto ⚠️", "en": "High impact ⚠️"},
}

AQI_KNOWN_CATEGORIES = {
    "good": {"es": "Buena", "en": "Good"},
    "moderate": {"es": "Moderada", "en": "Moderate"},
    "unhealthy for sensitive groups": {"es": "Dañina a sensibles", "en": "Unhealthy for sensitive groups"},
    "unhealthy": {"es": "Dañina", "en": "Unhealthy"},
    "very unhealthy": {"es": "Muy dañina", "en": "Very unhealthy"},
    "hazardous": {"es": "Peligrosa", "en": "Hazardous"},
    "desconocida": {"es": "Desconocida", "en": "Unknown"},
    "unknown": {"es": "Desconocida", "en": "Unknown"},
}


def compute_ecoimpact(temp_c, precip_mm, air_quality: dict | None):
    """Return localized eco impact summary (ES/EN)."""
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
        precip_key = "unknown"
    elif p < 1.0:
        precip_key = "low"
    elif p < 5.0:
        precip_key = "moderate"
    else:
        precip_key = "high"

    precip_text = PRECIP_TRANSLATIONS[precip_key]

    # AQI
    if aqi is None:
        aq_cat = AQI_KNOWN_CATEGORIES["unknown"]
        aqi_text = {"es": "AQI: s/d", "en": "AQI: n/a"}
    else:
        cat = _resolve_aqi_category(category, aqi)
        aq_cat = cat
        aqi_text = {"es": f"AQI: {aqi} ({cat['es']})", "en": f"AQI: {aqi} ({cat['en']})"}

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
        impact_key = "low"
    elif impact_score <= 3:
        impact_key = "medium"
    else:
        impact_key = "high"

    impact_text = IMPACT_TRANSLATIONS[impact_key]

    pol_text = {
        "es": f", dominante: {pollutant}" if pollutant else "",
        "en": f", dominant: {pollutant}" if pollutant else "",
    }

    return {
        "es": f"{impact_text['es']} — {precip_text['es']}. {aqi_text['es']}{pol_text['es']}",
        "en": f"{impact_text['en']} — {precip_text['en']}. {aqi_text['en']}{pol_text['en']}",
    }


def _resolve_aqi_category(category: str | None, aqi: int) -> dict[str, str]:
    if category:
        key = category.strip().lower()
        normalized = AQI_KNOWN_CATEGORIES.get(key)
        if normalized:
            return normalized

    if aqi <= 50:
        return AQI_KNOWN_CATEGORIES["good"]
    if aqi <= 100:
        return AQI_KNOWN_CATEGORIES["moderate"]
    if aqi <= 150:
        return AQI_KNOWN_CATEGORIES["unhealthy for sensitive groups"]
    if aqi <= 200:
        return AQI_KNOWN_CATEGORIES["unhealthy"]
    if aqi <= 300:
        return AQI_KNOWN_CATEGORIES["very unhealthy"]
    return AQI_KNOWN_CATEGORIES["hazardous"]
