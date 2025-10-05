from __future__ import annotations

import logging
from functools import lru_cache
from typing import Dict, List, Tuple

import nltk
from nltk import word_tokenize
from nltk.corpus import stopwords
from nltk.stem.snowball import SnowballStemmer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse import csr_matrix

LOGGER = logging.getLogger(__name__)

NLTK_PACKAGES = [
    ("punkt", "tokenizers/punkt"),
    ("punkt_tab", "tokenizers/punkt_tab"),
    ("stopwords", "corpora/stopwords"),
]

_DEFAULT_THRESHOLD = 0.35
_SUPPORTED_LANGS = {"es", "en"}


def ensure_nltk() -> None:
    for package, path in NLTK_PACKAGES:
        try:
            nltk.data.find(path)
        except LookupError:
            try:
                nltk.download(package, quiet=True)
            except Exception as exc:  # pragma: no cover - download best-effort
                LOGGER.warning("NLTK download failed for %s: %s", package, exc)


ensure_nltk()

_STOPWORDS: Dict[str, set] = {}
_STEMMERS: Dict[str, SnowballStemmer] = {}


def _get_stopwords(lang: str) -> set:
    lang = lang.lower()
    cache = _STOPWORDS.get(lang)
    if cache is not None:
        return cache
    if lang not in _SUPPORTED_LANGS:
        lang = "en"
    try:
        words = set(stopwords.words("spanish" if lang == "es" else "english"))
    except LookupError:
        ensure_nltk()
        words = set(stopwords.words("spanish" if lang == "es" else "english"))
    _STOPWORDS[lang] = words
    return words


def _get_stemmer(lang: str) -> SnowballStemmer:
    lang = lang.lower()
    cache = _STEMMERS.get(lang)
    if cache is not None:
        return cache
    stem_lang = "spanish" if lang == "es" else "english"
    stemmer = SnowballStemmer(stem_lang)
    _STEMMERS[lang] = stemmer
    return stemmer


def preprocess(text: str, lang: str) -> List[str]:
    tokens = []
    if not text:
        return tokens
    lang = lang.lower()
    if lang not in _SUPPORTED_LANGS:
        lang = "en"
    try:
        raw_tokens = word_tokenize(text, language="spanish" if lang == "es" else "english")
    except LookupError:
        ensure_nltk()
        raw_tokens = word_tokenize(text, language="spanish" if lang == "es" else "english")
    stops = _get_stopwords(lang)
    stemmer = _get_stemmer(lang)
    for token in raw_tokens:
        token_lower = token.lower()
        if token_lower.isalpha() and token_lower not in stops:
            tokens.append(stemmer.stem(token_lower))
    return tokens


INTENT_SAMPLES: Dict[str, Dict[str, List[str]]] = {
    "en": {
        "greeting": [
            "hello",
            "hi wayra",
            "good morning",
            "hey there",
            "what's up bot",
        ],
        "best_days": [
            "which are the best days",
            "top days for my event",
            "recommend a day",
            "when should we go",
            "give me the best days",
        ],
        "best_hours": [
            "what are the best hours",
            "better time of the day",
            "suggest good hours",
            "best hours to go",
        ],
        "heat_risk": [
            "will it be too hot",
            "risk of heat",
            "extreme heat alert",
            "is it too warm",
        ],
        "rain_risk": [
            "chance of rain",
            "risk of rain",
            "is precipitation high",
            "will it rain heavily",
        ],
        "general_advice": [
            "give me a recommendation",
            "overall advice",
            "what should we consider",
            "any tips for the event",
        ],
    },
    "es": {
        "greeting": [
            "hola",
            "buenos días",
            "qué tal wayra",
            "holi",
            "saludos",
        ],
        "best_days": [
            "mejores días",
            "qué días recomiendas",
            "dime los mejores días",
            "qué día es mejor",
            "top días para el evento",
        ],
        "best_hours": [
            "mejores horas",
            "horas ideales",
            "qué hora conviene",
            "horarios óptimos",
        ],
        "heat_risk": [
            "riesgo de calor",
            "va a hacer mucho calor",
            "calor extremo",
            "demasiada temperatura",
        ],
        "rain_risk": [
            "riesgo de lluvia",
            "lloverá mucho",
            "precipitación alta",
            "probabilidad de lluvia",
        ],
        "general_advice": [
            "recomendación general",
            "algún consejo",
            "qué deberíamos considerar",
            "tips para el evento",
        ],
    },
}

INTENT_ALIASES = {
    "greeting": {"es": "saludo", "en": "greeting"},
    "best_days": {"es": "mejores_dias", "en": "best_days"},
    "best_hours": {"es": "mejores_horas", "en": "best_hours"},
    "heat_risk": {"es": "riesgo_calor", "en": "heat_risk"},
    "rain_risk": {"es": "riesgo_lluvia", "en": "rain_risk"},
    "general_advice": {"es": "recomendacion_general", "en": "general_advice"},
}


@lru_cache(maxsize=4)
def _build_model(lang: str) -> Tuple[TfidfVectorizer, csr_matrix, List[str]]:
    lang = lang.lower()
    if lang not in _SUPPORTED_LANGS:
        lang = "en"
    dataset: List[str] = []
    labels: List[str] = []
    samples = INTENT_SAMPLES[lang]
    for intent, phrases in samples.items():
        for phrase in phrases:
            tokens = preprocess(phrase, lang)
            dataset.append(" ".join(tokens))
            labels.append(intent)
    if not dataset:
        dataset = ["general"]
        labels = ["general_advice"]
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
    matrix = vectorizer.fit_transform(dataset)
    return vectorizer, matrix, labels


def _infer_ml(text: str, lang: str) -> Tuple[str, float]:
    vectorizer, matrix, labels = _build_model(lang)
    processed_query = " ".join(preprocess(text, lang))
    if not processed_query:
        return "general_advice", 0.0
    query_vector = vectorizer.transform([processed_query])
    similarity = cosine_similarity(query_vector, matrix)
    best_idx = int(similarity.argmax())
    best_score = float(similarity[0, best_idx])
    intent = labels[best_idx]
    return intent, best_score


RULE_KEYWORDS = {
    "best_days": {
        "en": {"best day", "which day", "top day"},
        "es": {"mejor día", "mejores días", "qué día"},
    },
    "best_hours": {
        "en": {"best hour", "what hour", "time of the day"},
        "es": {"mejor hora", "qué hora", "horario"},
    },
    "heat_risk": {
        "en": {"heat", "too hot", "very hot"},
        "es": {"calor", "caliente", "sofocante"},
    },
    "rain_risk": {
        "en": {"rain", "precip"},
        "es": {"lluv", "precipit"},
    },
}


def _fallback_intent(text: str, lang: str) -> str:
    lowered = text.lower()
    for intent, lang_map in RULE_KEYWORDS.items():
        for keyword in lang_map.get(lang, set()):
            if keyword in lowered:
                return intent
    return "general_advice"


def nlu_infer(text: str, lang: str) -> Dict[str, float | str]:
    lang_norm = lang.lower() if lang.lower() in _SUPPORTED_LANGS else "en"
    intent, score = _infer_ml(text, lang_norm)
    if score < _DEFAULT_THRESHOLD:
        intent = _fallback_intent(text, lang_norm)
    intent_key = INTENT_ALIASES.get(intent, {}).get(lang_norm, intent)
    return {"intent": intent_key, "base_intent": intent, "score": score}
