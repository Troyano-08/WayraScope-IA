# main.py
from __future__ import annotations

import csv
import io
import json
import re
import unicodedata
import logging
from datetime import datetime, timedelta
from typing import Any, Optional, Dict, List, Tuple, Union, Literal

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from utils.data_quality import series_quality
from externals.geocoding_api import get_coordinates, reverse_geocode
from externals.openmeteo_api import (
    get_openmeteo as fetch_openmeteo_daily,
    get_hourly_weather as fetch_openmeteo_hourly,
)
from externals.waqi_api import get_air_quality
from nasa.power_api import get_power_data
from nasa.historical_probabilities import compute_historical_probabilities
from externals.weather_api import get_hourly_weather as fetch_weather_hourly
from utils.merge_data import merge_sources
from ai.comfort import compute_comfort
from ai.ecoimpact import compute_ecoimpact
from ai.compare import compare_trends
from ai.wayrabot import wayrabot_advice, find_best_days
from ai.nlp import nlu_infer

LOGGER = logging.getLogger(__name__)

app = FastAPI(title="WayraScope AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "X-WayraMeta"],
)

class AnalyzeInput(BaseModel):
    city: str = Field(..., example="Huánuco")
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", example="2025-10-05")
    event_type: Optional[str] = Field(default="viaje", example="viaje")


class AnalyzeCoordsInput(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0)
    lon: float = Field(..., ge=-180.0, le=180.0)
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", example="2025-10-05")
    event_type: Optional[str] = Field(default="viaje", example="viaje")


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatContext(BaseModel):
    probabilities: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    best_days: List[Dict[str, Any]] = Field(default_factory=list)
    location: Dict[str, Any] = Field(default_factory=dict)
    date: str


class ChatMLRequest(BaseModel):
    lang: Literal["es", "en"] = "es"
    event_type: Optional[str] = "viaje"
    context: ChatContext
    history: List[ChatMessage] = Field(default_factory=list)

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
        data = fetch_weather_hourly(lat, lon, date)
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error al obtener horario: {e}")

def _sanitize_filename_segment(value: str) -> str:
    if not value:
        return "wayrascope"
    normalized = unicodedata.normalize("NFKD", value)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^A-Za-z0-9._-]+", "_", ascii_only).strip("_")
    return slug or "wayrascope"


def _normalize_location(loc: Dict[str, Any], lat: float, lon: float) -> Dict[str, Any]:
    name = loc.get("name") or loc.get("city")
    country = loc.get("country") or loc.get("country_code")
    return {
        "name": name or f"{lat:.3f}, {lon:.3f}",
        "country": country or "NA",
        "lat": float(lat),
        "lon": float(lon)
    }


def _run_analysis_for_location(loc: Dict[str, Any], date: str, event: str) -> Tuple[Dict, Dict]:
    lat = loc.get("lat")
    lon = loc.get("lon")
    if lat is None or lon is None:
        raise ValueError("Ubicación sin coordenadas válidas")

    lat = float(lat)
    lon = float(lon)
    normalized_loc = _normalize_location(loc, lat, lon)

    start, end = _range_10(date)

    nasa = get_power_data(lat, lon, start, end)
    meteo = fetch_openmeteo_daily(lat, lon)
    air = get_air_quality(lat, lon)

    merged = merge_sources(nasa, meteo, air)
    combined_daily = _combine_daily_series(date, merged)

    current = merged["current"]
    comfort = compute_comfort(current.get("temperature"), current.get("humidity"), current.get("wind"))
    eco = compute_ecoimpact(current.get("temperature"), current.get("precipitation"), merged["air_quality_index"])

    trends = compare_trends({
        "temperature": combined_daily["temperature"],
        "precipitation": combined_daily["precipitation"],
        "humidity": combined_daily["humidity"],
        "wind": combined_daily["wind"]
    })

    best_days = find_best_days(
        event,
        dates=combined_daily["dates"],
        temperature=combined_daily["temperature"],
        precipitation=combined_daily["precipitation"],
        wind=combined_daily["wind"],
        humidity=combined_daily["humidity"],
    )

    probabilities: Optional[Dict[str, Any]] = None
    try:
        probabilities = compute_historical_probabilities(lat, lon, date)
    except Exception as exc:
        LOGGER.warning("Historical probabilities failed: %s", exc)

    advisor = wayrabot_advice(event, comfort, eco, trends, best_days)

    out = {
        "location": {
            "city": normalized_loc["name"],
            "country": normalized_loc["country"],
            "lat": normalized_loc["lat"],
            "lon": normalized_loc["lon"],
        },
        "range": f"{start.replace('-', '')} a {end.replace('-', '')}",
        "temperature": combined_daily["temperature"],
        "humidity": combined_daily["humidity"],
        "precipitation": combined_daily["precipitation"],
        "wind": combined_daily["wind"],
        "air_quality_index": merged["air_quality_index"],
        "comfort_index": comfort["es"],
        "eco_impact": eco["es"],
        "trend": trends,
        "wayra_advisor": advisor["es"],
        "best_days": best_days,
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
                "Los días sin dato de NASA (futuros o no disponibles) se complementan con Open-Meteo para estimar tendencias."
            ]
        }
    }

    if probabilities:
        out["probabilities"] = probabilities

    out["comfort_index_i18n"] = comfort
    out["eco_impact_i18n"] = eco
    out["wayra_advisor_i18n"] = advisor

    context = {
        "merged": merged,
        "daily": combined_daily,
        "start": start,
        "end": end,
        "event_type": event,
        "coordinates": {"lat": normalized_loc["lat"], "lon": normalized_loc["lon"]},
        "probabilities": probabilities or {}
    }

    return out, context


def _run_analysis(city: str, date: str, event_type: Optional[str] = None) -> Tuple[Dict, Dict]:
    event = event_type or "viaje"
    loc = get_coordinates(city)
    return _run_analysis_for_location(loc, date, event)


def _run_analysis_coords(lat: float, lon: float, date: str, event_type: Optional[str] = None) -> Tuple[Dict, Dict]:
    event = event_type or "viaje"
    loc = None
    try:
        loc = reverse_geocode(lat, lon)
    except Exception as exc:
        LOGGER.warning("Reverse geocode failed: %s", exc)
    if not loc:
        loc = {"name": None, "country": None, "lat": lat, "lon": lon}
    loc.setdefault("lat", lat)
    loc.setdefault("lon", lon)
    return _run_analysis_for_location(loc, date, event)


@app.post("/analyze")
def analyze(payload: AnalyzeInput):
    try:
        result, _ = _run_analysis(payload.city, payload.date, payload.event_type)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error en /analyze: {e}")


@app.post("/analyze/coords")
def analyze_coords(payload: AnalyzeCoordsInput):
    try:
        result, _ = _run_analysis_coords(payload.lat, payload.lon, payload.date, payload.event_type)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error en /analyze/coords: {e}")


def _build_daily_dataset(
    analysis: Dict,
    context: Dict,
    date: str
) -> List[Dict[str, Union[str, float, None]]]:
    merged = context.get("merged", {})
    nasa_daily = merged.get("daily_nasa", {})
    dates_raw = nasa_daily.get("dates", [])

    combined_daily = context.get("daily") if isinstance(context.get("daily"), dict) else None
    combined_dates = combined_daily.get("dates", []) if combined_daily else []

    start_str, _ = _range_10(date)
    start_dt = datetime.strptime(start_str, "%Y-%m-%d")

    temperature = analysis.get("temperature", [])
    humidity = analysis.get("humidity", [])
    wind = analysis.get("wind", [])
    precipitation = analysis.get("precipitation", [])

    length = max(len(temperature), len(humidity), len(wind), len(precipitation))
    dataset: List[Dict[str, Union[str, float, None]]] = []

    for idx in range(length):
        if idx < len(combined_dates):
            date_value = combined_dates[idx]
        elif idx < len(dates_raw) and dates_raw[idx]:
            raw_value = str(dates_raw[idx])
            date_value = _fmt_out(raw_value)
        else:
            date_value = (start_dt + timedelta(days=idx)).strftime("%Y-%m-%d")

        dataset.append(
            {
                "date": date_value,
                "temperature": temperature[idx] if idx < len(temperature) else None,
                "humidity": humidity[idx] if idx < len(humidity) else None,
                "wind": wind[idx] if idx < len(wind) else None,
                "precipitation": precipitation[idx] if idx < len(precipitation) else None,
            }
        )

    return dataset


def _coerce_float(value: Any) -> Optional[float]:
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _combine_daily_series(date: str, merged: Dict[str, Any]) -> Dict[str, List[Optional[float]]]:
    start, end = _range_10(date)
    start_dt = datetime.strptime(start, "%Y-%m-%d")
    end_dt = datetime.strptime(end, "%Y-%m-%d")

    total_days = (end_dt - start_dt).days + 1
    timeline = [(start_dt + timedelta(days=offset)).strftime("%Y-%m-%d") for offset in range(total_days)]

    nasa_daily = merged.get("daily_nasa", {})
    nasa_dates = nasa_daily.get("dates", [])

    def _build_nasa_map(values_key: str) -> Dict[str, Optional[float]]:
        values = nasa_daily.get(values_key, [])
        mapping: Dict[str, Optional[float]] = {}
        for idx, raw_date in enumerate(nasa_dates):
            if raw_date is None:
                continue
            key = _fmt_out(str(raw_date))
            val = values[idx] if idx < len(values) else None
            mapping[key] = _coerce_float(val)
        return mapping

    nasa_temperature = _build_nasa_map("temperature")
    nasa_precip = _build_nasa_map("precipitation")
    nasa_wind = _build_nasa_map("wind")
    nasa_humidity = _build_nasa_map("humidity")

    open_daily = merged.get("daily_openmeteo", {})
    open_dates = open_daily.get("dates", [])
    open_tmax = open_daily.get("tmax", [])
    open_tmin = open_daily.get("tmin", [])
    open_prec = open_daily.get("precipitation", [])
    open_wind_max = open_daily.get("wind_max", [])
    open_humidity = open_daily.get("humidity", [])

    open_temperature: Dict[str, Optional[float]] = {}
    open_precip: Dict[str, Optional[float]] = {}
    open_wind: Dict[str, Optional[float]] = {}
    open_humid: Dict[str, Optional[float]] = {}

    for idx, day in enumerate(open_dates):
        temp_max = _coerce_float(open_tmax[idx] if idx < len(open_tmax) else None)
        temp_min = _coerce_float(open_tmin[idx] if idx < len(open_tmin) else None)
        precip_val = _coerce_float(open_prec[idx] if idx < len(open_prec) else None)
        wind_val = _coerce_float(open_wind_max[idx] if idx < len(open_wind_max) else None)
        humid_val = _coerce_float(open_humidity[idx] if idx < len(open_humidity) else None)

        if temp_max is not None and temp_min is not None:
            open_temperature[day] = (temp_max + temp_min) / 2.0
        elif temp_max is not None or temp_min is not None:
            open_temperature[day] = temp_max if temp_max is not None else temp_min

        if precip_val is not None:
            open_precip[day] = precip_val

        if wind_val is not None:
            # Los datos diarios de Open-Meteo reportan ráfagas máximas. Ajustamos para aproximar viento medio.
            open_wind[day] = wind_val * 0.7

        if humid_val is not None:
            open_humid[day] = humid_val

    temperatures: List[Optional[float]] = []
    precipitation: List[Optional[float]] = []
    wind: List[Optional[float]] = []
    humidity: List[Optional[float]] = []

    for day in timeline:
        temp_val = nasa_temperature.get(day)
        if temp_val is None:
            temp_val = open_temperature.get(day)

        precip_val = nasa_precip.get(day)
        if precip_val is None:
            precip_val = open_precip.get(day)

        wind_val = nasa_wind.get(day)
        if wind_val is None:
            wind_val = open_wind.get(day)

        humid_val = nasa_humidity.get(day)
        if humid_val is None:
            humid_val = open_humid.get(day)

        temperatures.append(temp_val)
        precipitation.append(precip_val)
        wind.append(wind_val)
        humidity.append(humid_val)

    return {
        "dates": timeline,
        "temperature": temperatures,
        "precipitation": precipitation,
        "wind": wind,
        "humidity": humidity,
    }


def _build_csv_content(rows: List[Dict[str, Union[str, float, None]]]) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["date", "temperature", "humidity", "wind", "precipitation"])
    for row in rows:
        writer.writerow([
            row.get("date", ""),
            "" if row.get("temperature") is None else row["temperature"],
            "" if row.get("humidity") is None else row["humidity"],
            "" if row.get("wind") is None else row["wind"],
            "" if row.get("precipitation") is None else row["precipitation"],
        ])
    return buffer.getvalue()


def _lang_text(lang: str, es: str, en: str) -> str:
    return es if lang == "es" else en


def _format_percent(value: Optional[float]) -> str:
    if value is None:
        return "s/d"
    return f"{value * 100:.0f}%"


def _summarize_best_hours(
    lat: Optional[float],
    lon: Optional[float],
    date: str,
    lang: str
) -> List[Dict[str, Union[str, float]]]:
    if lat is None or lon is None:
        return []
    try:
        hourly = fetch_weather_hourly(lat, lon, date)
    except Exception as exc:  # pragma: no cover - external API failure
        LOGGER.warning("Best hours fetch failed: %s", exc)
        return []

    times = hourly.get("time", [])
    temperatures = hourly.get("temperature", [])
    precip = hourly.get("precipitation", [])
    humidity = hourly.get("humidity", [])
    wind = hourly.get("wind", [])

    scored: List[Dict[str, Union[str, float]]] = []
    for idx, timestamp in enumerate(times):
        temp = temperatures[idx] if idx < len(temperatures) else None
        rain = precip[idx] if idx < len(precip) else None
        hum = humidity[idx] if idx < len(humidity) else None
        wind_speed = wind[idx] if idx < len(wind) else None

        score = 1.0
        notes: List[str] = []

        if isinstance(temp, (int, float)):
            score += max(0.0, 1.0 - abs(temp - 24) / 12)
            if temp >= 32:
                score -= 0.6
                notes.append(_lang_text(lang, "calor alto", "very warm"))
            elif temp <= 18:
                score -= 0.25
                notes.append(_lang_text(lang, "fresco", "cool"))

        if isinstance(rain, (int, float)):
            score -= min(1.0, rain * 0.4)
            if rain >= 1.0:
                notes.append(_lang_text(lang, "lluvia", "rain"))

        if isinstance(hum, (int, float)) and hum > 70:
            score -= (hum - 70) / 120
            notes.append(_lang_text(lang, "humedad", "humidity"))

        if isinstance(wind_speed, (int, float)) and wind_speed > 7:
            score -= (wind_speed - 7) / 15
            notes.append(_lang_text(lang, "viento", "wind"))

        scored.append(
            {
                "time": timestamp,
                "score": round(score, 3),
                "notes": ", ".join(notes) if notes else _lang_text(lang, "condiciones estables", "stable conditions"),
            }
        )

    scored.sort(key=lambda item: item.get("score", 0.0), reverse=True)
    return scored[:3]


def _default_followups(lang: str) -> List[str]:
    return [
        _lang_text(lang, "¿Quieres horarios ideales?", "Do you want suggested hours?"),
        _lang_text(lang, "¿Analizamos otra fecha?", "Shall we analyse another date?"),
    ]


def _compose_bot_reply(request: ChatMLRequest, nlu: Dict[str, Any]) -> Tuple[str, List[str]]:
    lang = request.lang
    context = request.context
    base_intent = nlu.get("base_intent", "general_advice")
    score = nlu.get("score", 0.0)
    followups = _default_followups(lang)

    best_days = context.best_days or []
    probabilities = context.probabilities or {}
    location = context.location or {}
    city_name = location.get("city")
    lat = location.get("lat")
    lon = location.get("lon")
    date = context.date

    if base_intent == "best_days":
        if not best_days:
            reply = _lang_text(
                lang,
                "Aún no tengo un ranking de días. Ejecuta un análisis reciente.",
                "I don't have a ranking of days yet. Please run a fresh analysis."
            )
        else:
            lines = []
            for idx, day in enumerate(best_days[:3], start=1):
                notes = day.get("notes") or ""
                score_txt = day.get("score")
                if isinstance(score_txt, (int, float)):
                    score_fmt = f"{score_txt:.0f}"
                else:
                    score_fmt = "—"
                lines.append(
                    _lang_text(
                        lang,
                        f"{idx}. {day.get('date')} — puntaje {score_fmt} · {notes}",
                        f"{idx}. {day.get('date')} — score {score_fmt} · {notes}"
                    )
                )
            header = _lang_text(lang, "Top 3 días recomendados:", "Top 3 recommended days:")
            reply = header + "\n" + "\n".join(lines)
            followups.insert(0, _lang_text(lang, "¿Quieres horarios por día?", "Need hour-by-hour tips?"))
        return reply, followups

    if base_intent == "best_hours":
        hours = _summarize_best_hours(lat if isinstance(lat, (int, float)) else None, lon if isinstance(lon, (int, float)) else None, date, lang)
        if not hours:
            reply = _lang_text(
                lang,
                "No pude obtener horas ideales ahora. Intenta actualizar el análisis.",
                "Couldn't fetch ideal hours right now. Try refreshing the analysis."
            )
        else:
            intro = _lang_text(lang, "Horas sugeridas para tu evento:", "Suggested hours for your event:")
            lines = [
                _lang_text(
                    lang,
                    f"• {item['time']} — puntaje {item['score']:.2f} · {item['notes']}",
                    f"• {item['time']} — score {item['score']:.2f} · {item['notes']}"
                )
                for item in hours
            ]
            reply = intro + "\n" + "\n".join(lines)
            followups.insert(0, _lang_text(lang, "¿Quieres ver riesgos de calor?", "Check heat risks?"))
        return reply, followups

    if base_intent == "heat_risk":
        hot = probabilities.get("very_hot") or {}
        prob_text = _format_percent(hot.get("prob"))
        threshold = hot.get("threshold")
        if threshold is None:
            detail = _lang_text(lang, "Sin métricas recientes de calor extremo.", "No recent extreme heat metrics.")
        else:
            detail = _lang_text(
                lang,
                f"Probabilidad de calor ≥ {threshold}°C: {prob_text}.",
                f"Chance of heat ≥ {threshold}°C: {prob_text}."
            )
        advice = _lang_text(
            lang,
            "Considera toldos, bebidas frías y pausas a la sombra.",
            "Plan for shade, cool drinks, and pacing yourselves."
        )
        reply = f"{detail} {advice}"
        followups.insert(0, _lang_text(lang, "¿Ver horas más frescas?", "Want cooler hours?"))
        return reply, followups

    if base_intent == "rain_risk":
        humid = probabilities.get("very_humid") or {}
        prob_text = _format_percent(humid.get("prob"))
        threshold = humid.get("threshold")
        if threshold is None:
            detail = _lang_text(lang, "Sin medición actual de humedad alta.", "No current high humidity metric.")
        else:
            detail = _lang_text(
                lang,
                f"Probabilidad de humedad ≥ {threshold}%: {prob_text}.",
                f"Chance of humidity ≥ {threshold}%: {prob_text}."
            )
        advice = _lang_text(
            lang,
            "Ten plan B bajo techo y prepara impermeables.",
            "Prepare a covered fallback and rain protection."
        )
        reply = f"{detail} {advice}"
        followups.insert(0, _lang_text(lang, "¿Quieres sugerencias por horas secas?", "Need drier time slots?"))
        return reply, followups

    if base_intent == "greeting":
        reply = _lang_text(
            lang,
            f"¡Hola! Estoy listo para ayudarte con el evento {request.event_type}. ¿En qué te apoyo?",
            f"Hi there! I'm ready to help with your {request.event_type} event. How can I support you?"
        )
        return reply, followups

    best_day_line = ""
    if best_days:
        top_day = best_days[0]
        score_val = top_day.get("score")
        score_fmt = f"{score_val:.0f}" if isinstance(score_val, (int, float)) else "—"
        best_day_line = _lang_text(
            lang,
            f"El día con mejor puntaje es {top_day.get('date')} (score {score_fmt}).",
            f"Top day so far is {top_day.get('date')} (score {score_fmt})."
        )
    location_line = _lang_text(
        lang,
        f"Ubicación: {city_name or '—'} · fecha base {date}.",
        f"Location: {city_name or '—'} · base date {date}."
    )
    summary = _lang_text(
        lang,
        "Puedo darte horarios, riesgos o alternativas logísticas.",
        "I can share best hours, risk outlooks, or backup plans."
    )
    reply = " ".join(filter(None, [best_day_line, location_line, summary]))
    if score < _DEFAULT_THRESHOLD:
        followups.insert(0, _lang_text(lang, "Cuéntame qué necesitas (horas, riesgos, plan B).", "Tell me what you need (hours, risks, plan B)."))
    return reply.strip(), followups


def _build_filename(city: str, date: str, extension: str) -> str:
    city_slug = _sanitize_filename_segment(city)
    date_slug = _sanitize_filename_segment(date)
    return f"wayrascope_{city_slug}_{date_slug}.{extension}"


@app.get("/download")
def download_dataset(
    city: Optional[str] = Query(None, description="Ciudad base"),
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0),
    lon: Optional[float] = Query(None, ge=-180.0, le=180.0),
    date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    fmt: Optional[str] = Query("csv"),
    event_type: Optional[str] = Query(None)
):
    normalized_fmt = (fmt or "csv").strip().lower()
    if normalized_fmt not in {"csv", "json"}:
        raise HTTPException(status_code=400, detail="Formato no soportado. Usa csv o json.")

    if (lat is None) ^ (lon is None):
        raise HTTPException(status_code=400, detail="Debes proveer lat y lon juntos.")

    if city is None and (lat is None or lon is None):
        raise HTTPException(status_code=400, detail="Indica ciudad o coordenadas para generar la descarga.")

    try:
        if lat is not None and lon is not None:
            analysis, context = _run_analysis_coords(lat, lon, date, event_type)
        else:
            analysis, context = _run_analysis(city or "", date, event_type)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error en /download: {exc}")

    dataset = _build_daily_dataset(analysis, context, date)

    meta = {
        "city": analysis["location"]["city"],
        "country": analysis["location"].get("country"),
        "lat": analysis["location"].get("lat"),
        "lon": analysis["location"].get("lon"),
        "date": date,
        "event_type": context.get("event_type"),
        "range": analysis["range"],
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "units": analysis["meta"].get("units", {}),
    }

    filename = _build_filename(analysis["location"]["city"], date, normalized_fmt)
    meta_header = json.dumps(meta, ensure_ascii=True)

    if normalized_fmt == "json":
        payload = {"meta": meta, "data": dataset}
        response = JSONResponse(content=payload)
        response.headers["Content-Disposition"] = f'attachment; filename="{filename}"'
        response.headers["X-WayraMeta"] = meta_header
        return response

    csv_content = _build_csv_content(dataset)
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "X-WayraMeta": meta_header
    }
    return Response(content=csv_content, media_type="text/csv; charset=utf-8", headers=headers)

def _fmt_out(yyyymmdd: str) -> str:
    if "-" in yyyymmdd: return yyyymmdd
    return f"{yyyymmdd[0:4]}-{yyyymmdd[4:6]}-{yyyymmdd[6:8]}"
