# nasa/power_api.py
from __future__ import annotations
import requests
from typing import Dict, List, Optional
from datetime import datetime

PARAMS = "T2M,RH2M,WS2M,PRECTOTCORR"
FILL_SENTINELS = {-999, -9999, -99}

def _fmt(d: str) -> str:
    if "-" in d:
        return datetime.strptime(d, "%Y-%m-%d").strftime("%Y%m%d")
    return d

def _clean(v):
    try:
        f = float(v) if v is not None else None
    except Exception:
        return None
    if f is None:
        return None
    # POWER usa -999 (y variantes) como "no data"
    if int(f) in FILL_SENTINELS or f <= -900:
        return None
    return f

def get_power_data(lat: float, lon: float, start_date: str, end_date: str) -> Dict:
    start = _fmt(start_date)
    end = _fmt(end_date)
    url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    params = {
        "parameters": PARAMS,
        "community": "RE",
        "longitude": lon,
        "latitude": lat,
        "start": start,
        "end": end,
        "format": "JSON",
    }
    r = requests.get(url, params=params, timeout=25)
    r.raise_for_status()
    data = r.json()
    dset = data.get("properties", {}).get("parameter", {})

    def series(key):
        raw = dset.get(key, {})
        dates, vals = [], []
        for k in sorted(raw.keys()):
            dates.append(k)  # YYYYMMDD
            vals.append(_clean(raw[k]))
        return dates, vals

    dates_t, temp = series("T2M")
    dates_h, hum = series("RH2M")
    dates_w, wind = series("WS2M")
    dates_p, prec = series("PRECTOTCORR")
    dates = dates_t or dates_h or dates_w or dates_p

    def mean(x):
        xs = [v for v in x if isinstance(v, (int, float, float))]
        return sum(xs) / len(xs) if xs else None

    avg = {
        "temperature": mean(temp),
        "humidity": mean(hum),
        "wind": mean(wind),
        "precipitation": mean(prec),
    }

    return {
        "dates": dates,
        "temperature": temp,
        "humidity": hum,
        "wind": wind,
        "precipitation": prec,
        "avg": avg,
        "source": {"name": "NASA POWER", "url": "https://power.larc.nasa.gov/", "parameters": PARAMS}
    }
