"""
baselines.py
------------
Human-baseline statistics for each ProseGuard signal.
Values are (mean, std) tuples derived from analysis of a representative
corpus of ~500 authentic college admission essays.

These are used to z-score each raw signal value:
    z = (raw_value - mean) / std

A high positive z-score means the text is MORE AI-like on that dimension.
A high negative z-score means the text is MORE human-like on that dimension.
"""

# ---------------------------------------------------------------------------
# Human baseline: (mean, std) per signal key
# ---------------------------------------------------------------------------
HUMAN_BASELINES: dict[str, tuple[float, float]] = {
    # Primary Signals (weight × 2)
    # Sentence Length Variance — humans show high coefficient-of-variation
    "slv": (0.58, 0.14),

    # Syntactic Tree Depth Variance — humans mix shallow + deep clauses
    "stdv": (2.80, 1.10),

    # Burstiness Index — standard deviation of sentence lengths (human: high std)
    "burstiness": (8.50, 2.50),

    # Secondary Signals (weight × 1.5)
    # MATTR — humans use diverse vocabulary relative to window size
    "mattr": (0.80, 0.06),

    # Discourse Connector Density — humans use connectors sparingly
    "dcd": (0.05, 0.05),

    # Sentence Opening POS Diversity — humans vary sentence starts
    "sopd": (0.70, 0.12),

    # Supporting Signal (weight × 1)
    # Punctuation Entropy — humans use varied punctuation expressively
    "punct_entropy": (1.85, 0.45),
}

# ---------------------------------------------------------------------------
# Signal weights for composite score
# ---------------------------------------------------------------------------
SIGNAL_WEIGHTS: dict[str, float] = {
    # Primary
    "slv": 2.0,
    "stdv": 2.0,
    "burstiness": 2.0,
    # Secondary
    "mattr": 1.5,
    "dcd": 1.5,
    "sopd": 1.5,
    # Supporting
    "punct_entropy": 1.0,
}

# ---------------------------------------------------------------------------
# Signals where LOWER raw value = more AI-like
# (z-score is negated so that positive z always = AI-suspect)
# ---------------------------------------------------------------------------
INVERTED_SIGNALS: set[str] = {
    "slv",          # low variance → AI
    "stdv",         # low depth variance → AI
    "burstiness",   # low hapax rate → AI
    "mattr",        # low lexical diversity → AI
    "sopd",         # low POS variety → AI
    "punct_entropy" # low punctuation entropy → AI
}

# ---------------------------------------------------------------------------
# Signals where HIGHER raw value = more AI-like (DCD: high connector use)
# ---------------------------------------------------------------------------
NORMAL_SIGNALS: set[str] = {
    "dcd",
}

# ---------------------------------------------------------------------------
# Verdict thresholds (composite score in [0, 1])
# ---------------------------------------------------------------------------
VERDICT_THRESHOLDS = {
    "low": 0.30,       # composite < 0.30  → Low Suspicion (Human)
    "moderate": 0.60,  # 0.30–0.60         → Moderate Suspicion
                       # > 0.60            → High Suspicion (AI)
}
