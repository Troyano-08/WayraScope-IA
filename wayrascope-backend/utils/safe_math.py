# utils/safe_math.py
from __future__ import annotations
from typing import Iterable, Optional, List

def val(x, default=None):
    return default if x is None else x

def safe_mean(values: Iterable[Optional[float]], default=None):
    nums = [v for v in values if isinstance(v, (int, float))]
    if not nums:
        return default
    return sum(nums) / len(nums)

def safe_last(values: List[Optional[float]], default=None):
    for v in reversed(values):
        if isinstance(v, (int, float)):
            return v
    return default

def safe_first(values: List[Optional[float]], default=None):
    for v in values:
        if isinstance(v, (int, float)):
            return v
    return default

def trend_symbol(values: List[Optional[float]], window:int=3) -> str:
    """
    Compara promedio de los últimos 'window' vs primeros 'window' valores válidos.
    Retorna ⬆️, ⬇️ o ➡️.
    """
    nums = [v for v in values if isinstance(v, (int, float))]
    if len(nums) < max(2, 2*window):
        return "➡️ Estable"
    head = safe_mean(nums[:window], default=None)
    tail = safe_mean(nums[-window:], default=None)
    if head is None or tail is None:
        return "➡️ Estable"
    if tail > head * 1.03:
        return "⬆️ En aumento"
    if tail < head * 0.97:
        return "⬇️ En descenso"
    return "➡️ Estable"
