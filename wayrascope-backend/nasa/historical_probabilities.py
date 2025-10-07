"""Compute historical probability metrics from NASA POWER daily data."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
import logging
from typing import Dict, Iterable, List, Optional, Tuple

from .power_api import get_power_data

LOGGER = logging.getLogger(__name__)

START_YEAR = 2001
END_YEAR = 2024
WINDOW_RADIUS = 10  # days on each side of the target Day Of Year

# Threshold configuration used by the frontend probability cards.
TEMP_HOT_THRESHOLD = 32.0
TEMP_COLD_THRESHOLD = 12.0
WIND_STRONG_THRESHOLD = 8.0  # m/s
HUMID_HUMID_THRESHOLD = 80.0  # %
COMFORT_TEMP_THRESHOLD = 30.0
COMFORT_HUM_THRESHOLD = 75.0


@dataclass
class DailySample:
    date: datetime
    temperature: Optional[float]
    humidity: Optional[float]
    wind: Optional[float]
    precipitation: Optional[float]


def _safe_target_date(base: datetime, year: int) -> datetime:
    """Align the target month/day with the requested year.

    Handles leap years by falling back to 28 Feb on non-leap years when the
    requested date is 29 Feb.
    """

    month = base.month
    day = base.day

    if month == 2 and day == 29:
        try:
            return datetime(year, month, day)
        except ValueError:
            return datetime(year, 2, 28)

    while True:
        try:
            return datetime(year, month, day)
        except ValueError:
            day -= 1
            if day < 1:
                day = 1
                break
    return datetime(year, month, day)


def _clamp(date: datetime, start: datetime, end: datetime) -> datetime:
    if date < start:
        return start
    if date > end:
        return end
    return date


def _collect_samples(lat: float, lon: float, target_date: datetime) -> List[DailySample]:
    samples: List[DailySample] = []
    global_start = datetime(START_YEAR, 1, 1)
    global_end = datetime(END_YEAR, 12, 31)

    for year in range(START_YEAR, END_YEAR + 1):
        anchor = _safe_target_date(target_date, year)
        start = anchor - timedelta(days=WINDOW_RADIUS)
        end = anchor + timedelta(days=WINDOW_RADIUS)

        if end < global_start or start > global_end:
            continue

        start = _clamp(start, global_start, global_end)
        end = _clamp(end, global_start, global_end)

        try:
            data = get_power_data(lat, lon, start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d"))
        except Exception as exc:  # pragma: no cover - network failure not deterministic
            LOGGER.warning("NASA POWER historical fetch failed for %s: %s", year, exc)
            continue

        dates = data.get("dates", [])
        temps = data.get("temperature", [])
        hums = data.get("humidity", [])
        winds = data.get("wind", [])
        precs = data.get("precipitation", [])

        for idx, raw_date in enumerate(dates):
            try:
                dt = datetime.strptime(str(raw_date), "%Y%m%d")
            except (TypeError, ValueError):
                continue

            temp_val = temps[idx] if idx < len(temps) else None
            hum_val = hums[idx] if idx < len(hums) else None
            wind_val = winds[idx] if idx < len(winds) else None
            prec_val = precs[idx] if idx < len(precs) else None

            samples.append(
                DailySample(
                    date=dt,
                    temperature=temp_val if isinstance(temp_val, (int, float)) else None,
                    humidity=hum_val if isinstance(hum_val, (int, float)) else None,
                    wind=wind_val if isinstance(wind_val, (int, float)) else None,
                    precipitation=prec_val if isinstance(prec_val, (int, float)) else None,
                )
            )

    return samples


def _probability(values: Iterable[Optional[float]], predicate) -> Tuple[Optional[float], int]:
    numeric = [v for v in values if isinstance(v, (int, float))]
    n = len(numeric)
    if n == 0:
        return None, 0
    hits = sum(1 for v in numeric if predicate(v))
    return hits / n, n


def compute_historical_probabilities(lat: float, lon: float, date_str: str) -> Optional[Dict[str, Dict[str, object]]]:
    """Return probability metrics for DOY ±10 over 2001-2024 NASA data."""

    try:
        target = datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return None

    samples = _collect_samples(lat, lon, target)
    if not samples:
        return None

    temperatures = [s.temperature for s in samples]
    humidity = [s.humidity for s in samples]
    wind = [s.wind for s in samples]

    hot_prob, hot_n = _probability(temperatures, lambda v: v >= TEMP_HOT_THRESHOLD)
    cold_prob, cold_n = _probability(temperatures, lambda v: v <= TEMP_COLD_THRESHOLD)
    windy_prob, windy_n = _probability(wind, lambda v: v >= WIND_STRONG_THRESHOLD)
    humid_prob, humid_n = _probability(humidity, lambda v: v >= HUMID_HUM_THRESHOLD)

    combo_values = [
        (s.temperature, s.humidity)
        for s in samples
        if isinstance(s.temperature, (int, float)) and isinstance(s.humidity, (int, float))
    ]
    combo_n = len(combo_values)
    combo_hits = sum(
        1
        for temp, hum in combo_values
        if temp >= COMFORT_TEMP_THRESHOLD and hum >= COMFORT_HUM_THRESHOLD
    )
    combo_prob = combo_hits / combo_n if combo_n else None

    return {
        "very_hot": {"prob": hot_prob, "n": hot_n, "threshold": TEMP_HOT_THRESHOLD},
        "very_cold": {"prob": cold_prob, "n": cold_n, "threshold": TEMP_COLD_THRESHOLD},
        "very_windy": {"prob": windy_prob, "n": windy_n, "threshold": WIND_STRONG_THRESHOLD},
        "very_humid": {"prob": humid_prob, "n": humid_n, "threshold": HUMID_HUM_THRESHOLD},
        "very_uncomfortable": {
            "prob": combo_prob,
            "n": combo_n,
            "rule": "Temp >= 30C + humedad >= 75%",
        },
    }

