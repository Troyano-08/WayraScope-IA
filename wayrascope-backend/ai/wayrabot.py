# ai/wayrabot.py
from __future__ import annotations
from typing import Dict, List, Optional, Tuple
from utils.safe_math import safe_mean

def wayrabot_advice(event_type: str, comfort_text: str, eco_text: str, trends: Dict[str, str], best_days: List[Dict]) -> str:
    trend_bits = []
    for k, v in trends.items():
        if k == "temperature" and v.startswith("⬆️"): trend_bits.append("temperaturas al alza")
        if k == "precipitation" and v.startswith("⬇️"): trend_bits.append("menos lluvia")
        if k == "wind" and v.startswith("➡️"): trend_bits.append("viento estable")
    trend_sentence = f"Tendencia: {', '.join(trend_bits)}. " if trend_bits else ""

    best_txt = ""
    if best_days:
        tops = [d["date"] for d in best_days[:3]]
        best_txt = f" Días recomendados: {', '.join(tops)}."

    base = {
        "viaje": "Buen momento para moverte ligero, hidrátate y prioriza actividades al aire libre.",
        "desfile": "Evalúa sombras y puntos de hidratación; ensaya temprano si el sol sube.",
        "caminata": "Empieza temprano, lleva bloqueador y ajusta el ritmo según el viento.",
        "pesca": "Revisa ráfagas y lluvia; si el viento es moderado, puede ser ideal.",
        "boda": "Ten plan B bajo techo si la precipitación sube; coordina ventilación.",
        "picnic": "Busca áreas con sombra y césped seco; evita colectores de viento."
    }
    tip = base.get(event_type.lower(), "Ajusta tu plan según tu tolerancia térmica y viento.")

    return (f"{trend_sentence}Confort: {comfort_text}. {eco_text}. {tip}{best_txt}").strip()

def find_best_days(event_type: str, dates: List[str], temperature: List[Optional[float]],
                   precipitation: List[Optional[float]], wind: List[Optional[float]], humidity: List[Optional[float]]) -> List[Dict]:
    """
    Scoring por día usando reglas simples y pesos por tipo de evento.
    Devuelve lista ordenada desc: [{date, score, notes}]
    """
    # Pesos por evento
    weights = {
        "viaje": dict(temp=1.0, precip=1.5, wind=0.8, humid=0.7),
        "desfile": dict(temp=1.2, precip=1.8, wind=1.0, humid=0.6),
        "caminata": dict(temp=1.3, precip=1.4, wind=1.0, humid=0.8),
        "pesca": dict(temp=0.8, precip=1.7, wind=1.2, humid=0.6),
        "boda": dict(temp=1.5, precip=2.0, wind=0.7, humid=0.7),
        "picnic": dict(temp=1.2, precip=1.6, wind=0.8, humid=1.0),
    }
    w = weights.get(event_type.lower(), dict(temp=1.1, precip=1.5, wind=0.9, humid=0.8))

    out = []
    for i, d in enumerate(dates):
        t = temperature[i] if i < len(temperature) else None
        p = precipitation[i] if i < len(precipitation) else None
        wi = wind[i] if i < len(wind) else None
        hu = humidity[i] if i < len(humidity) else None

        # Score temperatura (ideal 18-26)
        t_score = 0 if t is None else max(0, 2 - abs((t - 22) / 4))  # pico a 22°C
        # Score precip (menos mejor)
        p_score = 0 if p is None else (2.0 if p < 1 else (1.0 if p < 3 else 0.0))
        # Score viento (ideal 1-5 m/s)
        wi_score = 0 if wi is None else (2.0 if 1 <= wi <= 5 else (1.0 if 0 <= wi <= 7 else 0.0))
        # Score humedad (ideal 45-65)
        hu_score = 0 if hu is None else (2.0 if 45 <= hu <= 65 else (1.0 if 35 <= hu <= 75 else 0.0))

        score = (w["temp"]*t_score + w["precip"]*p_score + w["wind"]*wi_score + w["humid"]*hu_score)
        notes = []
        if p is not None and p < 1: notes.append("lluvia baja")
        if t is not None and 18 <= t <= 26: notes.append("temperatura agradable")
        if wi is not None and 1 <= wi <= 5: notes.append("viento cómodo")
        if hu is not None and 45 <= hu <= 65: notes.append("humedad óptima")

        out.append({"date": d, "score": round(score, 2), "notes": ", ".join(notes)})

    # Orden descendente por score
    out.sort(key=lambda x: x["score"], reverse=True)
    return out[:5]
