# ai/comfort.py
from __future__ import annotations
from utils.safe_math import val

def compute_comfort(temp_c, rh_pct, wind_ms):
    """
    Clasifica confort general de forma robusta a None.
    Umbrales simples pero prácticos para eventos al aire libre.
    """
    t = val(temp_c, 24.0)
    h = val(rh_pct, 60.0)
    w = val(wind_ms, 2.0)

    score = 0.0
    # Temperatura ideal 18-28°C
    if 20 <= t <= 26: score += 2
    elif 18 <= t <= 28: score += 1
    else: score -= 1

    # Humedad relativa ideal 40-65%
    if 45 <= h <= 65: score += 2
    elif 35 <= h <= 75: score += 1
    else: score -= 1

    # Viento ideal 1-5 m/s (brisa)
    if 1.0 <= w <= 5.0: score += 2
    elif 0.0 <= w <= 8.0: score += 1
    else: score -= 1

    if score >= 5: return "Excelente 🌟"
    if score >= 3: return "Agradable 🙂"
    if score >= 1: return "Moderado 😐"
    if score >= -1: return "Desfavorable 😓"
    return "Crítico 🚫"
