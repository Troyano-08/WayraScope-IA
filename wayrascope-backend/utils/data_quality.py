# utils/data_quality.py
from __future__ import annotations
from typing import Iterable

def series_quality(series: Iterable) -> dict:
    vals = list(series or [])
    n = len(vals)
    valid = sum(isinstance(x, (int, float)) for x in vals)
    nulls = n - valid
    coverage = round(valid / n, 3) if n else 0.0
    return {"n": n, "valid": valid, "nulls": nulls, "coverage": coverage}
