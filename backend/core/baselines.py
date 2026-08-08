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
    "slv": (0.4419, 0.1237),

    # Syntactic Tree Depth Variance (std) — humans mix shallow + deep clauses
    "stdv": (1.9579, 0.5678),

    # Burstiness Index — mean content-word length; higher = more Latinate/AI-like
    "burstiness": (6.1169, 0.5131),

    # Secondary Signals (weight × 1.5)
    # MATTR — humans use diverse vocabulary relative to window size
    "mattr": (0.7744, 0.0393),

    # Discourse Connector Density — humans use connectors sparingly
    "dcd": (0.0617, 0.082),

    # Sentence Opening POS Diversity — humans vary sentence starts
    "sopd": (0.645, 0.1412),

    # Supporting Signal (weight × 1)
    # Punctuation Entropy — humans use varied punctuation expressively
    "punct_entropy": (1.3572, 0.5014),
}

# ---------------------------------------------------------------------------
# Signal weights for composite score
# ---------------------------------------------------------------------------
SIGNAL_WEIGHTS: dict[str, float] = {
    # Primary
    "slv": 2.19,
    "stdv": 1.59,
    "burstiness": 2.6,
    # Secondary
    "mattr": 1.43,
    "dcd": 1.95,
    "sopd": 1.39,
    # Supporting
    "punct_entropy": 1.3,
}

# ---------------------------------------------------------------------------
# Signals where LOWER raw value = more AI-like
# (z-score is negated so that positive z always = AI-suspect)
# ---------------------------------------------------------------------------
INVERTED_SIGNALS: set[str] = {
    "slv",          # low variance → AI
    "stdv",         # low depth variance → AI
    "mattr",        # low lexical diversity → AI
    "sopd",         # low POS variety → AI
    "punct_entropy" # low punctuation entropy → AI
}

# ---------------------------------------------------------------------------
# Signals where HIGHER raw value = more AI-like (DCD: high connector use)
# ---------------------------------------------------------------------------
NORMAL_SIGNALS: set[str] = {
    "dcd",        # high connector density → AI
    "burstiness", # high mean content-word length → AI
}

# ---------------------------------------------------------------------------
# Verdict thresholds (composite score in [0, 1])
# ---------------------------------------------------------------------------
VERDICT_THRESHOLDS = {
    "low": 0.30,       # composite < 0.30  → Low Suspicion (Human)
    "moderate": 0.60,  # 0.30–0.60         → Moderate Suspicion
                       # > 0.60            → High Suspicion (AI)
}
