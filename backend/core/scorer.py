"""
scorer.py
---------
Combines raw signal values into a composite suspicion score and verdict.

Algorithm:
    1. Z-score each raw signal against its human baseline (mean, std).
    2. Invert z-scores for signals where lower raw = more AI-like,
       so that positive z always means "more suspicious (AI-like)".
    3. Clamp extreme z-scores to [-3, 3] to prevent single signal dominance.
    4. Apply per-signal weights (Primary×2, Secondary×1.5, Supporting×1).
    5. Compute weighted mean z-score.
    6. Map to [0, 1] via sigmoid: composite = sigmoid(weighted_z).
    7. Apply verdict thresholds.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Literal

from .baselines import (
    HUMAN_BASELINES,
    INVERTED_SIGNALS,
    NORMAL_SIGNALS,
    SIGNAL_WEIGHTS,
    VERDICT_THRESHOLDS,
)

Verdict = Literal["Low Suspicion", "Moderate Suspicion", "High Suspicion"]

# ---------------------------------------------------------------------------
# Explainer text per signal (shown in UI / CLI)
# ---------------------------------------------------------------------------
SIGNAL_EXPLANATIONS: dict[str, dict[str, str]] = {
    "slv": {
        "name": "Sentence-Length Variance",
        "human_desc": "Natural rhythm — sentence lengths vary widely.",
        "ai_desc": "Very uniform sentence lengths — a hallmark of AI generation.",
        "key": "slv",
        "weight_label": "Primary",
    },
    "stdv": {
        "name": "Syntactic Tree Depth Variance",
        "human_desc": "Mixes simple and complex clause structures naturally.",
        "ai_desc": "Syntactic complexity stays in an unnaturally narrow band.",
        "key": "stdv",
        "weight_label": "Primary",
    },
    "burstiness": {
        "name": "Burstiness Index",
        "human_desc": "Short, concrete vocabulary — uses everyday words and vivid specifics.",
        "ai_desc": "Long, Latinate content words — nominalizations like ‘engagement’, ‘aspirations’, ‘endeavors’.",
        "key": "burstiness",
        "weight_label": "Primary",
    },
    "mattr": {
        "name": "Lexical Diversity (MATTR)",
        "human_desc": "Diverse vocabulary across the text window.",
        "ai_desc": "Relies on a small, safe high-frequency vocabulary.",
        "key": "mattr",
        "weight_label": "Secondary",
    },
    "dcd": {
        "name": "Discourse Connector Density",
        "human_desc": "Sparse use of transition words — natural for a teen writer.",
        "ai_desc": "Overuses connectors like 'Furthermore', 'Moreover', 'Additionally'.",
        "key": "dcd",
        "weight_label": "Secondary",
    },
    "sopd": {
        "name": "Sentence-Opening POS Diversity",
        "human_desc": "Sentence openings vary unpredictably in structure.",
        "ai_desc": "Sentence openings repeat the same POS patterns (e.g. 'The [noun]', 'I [verb]').",
        "key": "sopd",
        "weight_label": "Secondary",
    },
    "punct_entropy": {
        "name": "Punctuation Entropy",
        "human_desc": "Uses varied punctuation — dashes, semicolons, parentheses.",
        "ai_desc": "Almost exclusively commas and periods — low punctuation variety.",
        "key": "punct_entropy",
        "weight_label": "Supporting",
    },
}


@dataclass
class SignalResult:
    key: str
    name: str
    raw_value: float
    z_score: float
    weight: float
    weight_label: str
    is_suspicious: bool          # True if this signal leans AI
    explanation: str             # Human-readable explanation
    human_baseline_mean: float
    human_baseline_std: float


@dataclass
class AnalysisResult:
    composite_score: float       # 0.0 → definitely human, 1.0 → definitely AI
    verdict: Verdict
    signals: list[SignalResult] = field(default_factory=list)
    word_count: int = 0
    sentence_count: int = 0


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _sigmoid(x: float) -> float:
    """Sigmoid function mapping any real to (0, 1)."""
    return 1.0 / (1.0 + math.exp(-x))


def _compute_z(key: str, raw: float) -> float:
    """
    Compute a z-score relative to the human baseline,
    with sign convention: positive z = more AI-like.
    """
    mean, std = HUMAN_BASELINES[key]
    if std == 0:
        return 0.0
    z = (raw - mean) / std
    # Invert for signals where low raw = more AI-like
    if key in INVERTED_SIGNALS:
        z = -z
    # Clamp to prevent runaway outliers
    return max(-3.0, min(3.0, z))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def score(raw_signals: dict[str, float], word_count: int = 0, sentence_count: int = 0) -> AnalysisResult:
    """
    Combine raw signal values into a full AnalysisResult.

    Args:
        raw_signals: dict from signals.extract_all()
        word_count:  total word count (for metadata)
        sentence_count: sentence count (for metadata)

    Returns:
        AnalysisResult with composite score, verdict, and per-signal breakdown.
    """
    signal_results: list[SignalResult] = []
    weighted_z_sum = 0.0
    weight_sum = 0.0

    for key, raw in raw_signals.items():
        z = _compute_z(key, raw)
        weight = SIGNAL_WEIGHTS.get(key, 1.0)
        exp = SIGNAL_EXPLANATIONS.get(key, {})
        mean, std = HUMAN_BASELINES.get(key, (0.0, 1.0))

        # Signal is "suspicious" if z exceeds the Moderate boundary (z ≈ 0.38)
        is_suspicious = z > 0.38

        explanation = exp.get("ai_desc", "") if is_suspicious else exp.get("human_desc", "")

        signal_results.append(
            SignalResult(
                key=key,
                name=exp.get("name", key),
                raw_value=raw,
                z_score=z,
                weight=weight,
                weight_label=exp.get("weight_label", ""),
                is_suspicious=is_suspicious,
                explanation=explanation,
                human_baseline_mean=mean,
                human_baseline_std=std,
            )
        )

        weighted_z_sum += z * weight
        weight_sum += weight

    weighted_mean_z = weighted_z_sum / weight_sum if weight_sum > 0 else 0.0
    # Shifted sigmoid (calibrated from dataset):
    # z=0 (baseline) -> ~0.2994 (Low Suspicion),
    # z~0.0 -> 0.30 (Moderate threshold), z~0.48 -> 0.60 (High threshold)
    composite = _sigmoid(2.6 * weighted_mean_z - 0.85)

    # Determine verdict
    if composite < VERDICT_THRESHOLDS["low"]:
        verdict: Verdict = "Low Suspicion"
    elif composite < VERDICT_THRESHOLDS["moderate"]:
        verdict = "Moderate Suspicion"
    else:
        verdict = "High Suspicion"

    # Sort: most suspicious first
    signal_results.sort(key=lambda s: s.z_score, reverse=True)

    return AnalysisResult(
        composite_score=round(composite, 4),
        verdict=verdict,
        signals=signal_results,
        word_count=word_count,
        sentence_count=sentence_count,
    )
