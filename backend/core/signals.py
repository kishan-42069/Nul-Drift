"""
signals.py
----------
Seven statistical signal extractors for ProseGuard.

Each function accepts a spaCy Doc and returns a single float.
All functions are pure (no side-effects) and work fully offline.

Signal catalogue:
    Primary (weight × 2):
        1. sentence_length_variance  → SLV
        2. syntactic_tree_depth_variance → STDV
        3. burstiness_index          → Burstiness
    Secondary (weight × 1.5):
        4. lexical_diversity_mattr   → MATTR
        5. discourse_connector_density → DCD
        6. sentence_opening_pos_diversity → SOPD
    Supporting (weight × 1):
        7. punctuation_entropy       → Punct Entropy
"""

from __future__ import annotations

import math
import re
import string
from collections import Counter
from typing import List

import numpy as np
import spacy

# ---------------------------------------------------------------------------
# Transition / discourse connector word list (lower-cased)
# ---------------------------------------------------------------------------
_DISCOURSE_CONNECTORS: frozenset[str] = frozenset(
    {
        "furthermore", "moreover", "however", "nevertheless", "consequently",
        "therefore", "thus", "hence", "additionally", "in addition",
        "in contrast", "on the other hand", "as a result", "for example",
        "for instance", "in conclusion", "in summary", "to summarize",
        "firstly", "secondly", "thirdly", "finally", "ultimately",
        "significantly", "notably", "importantly", "interestingly",
        "subsequently", "meanwhile", "nonetheless", "accordingly",
        "specifically", "particularly", "essentially", "overall",
    }
)


# ---------------------------------------------------------------------------
# Helper: get sentences as lists of tokens (filtering blanks)
# ---------------------------------------------------------------------------
def _sentences(doc: spacy.tokens.Doc) -> List[spacy.tokens.Span]:
    return [sent for sent in doc.sents if len(sent.text.strip()) > 0]


# ===========================================================================
# PRIMARY SIGNALS
# ===========================================================================

def sentence_length_variance(doc: spacy.tokens.Doc) -> float:
    """
    Coefficient of Variation (CV) of sentence lengths (in tokens).

    AI text tends to be uniform → low CV.
    Human text is rhythmically irregular → high CV.

    Returns: float (≥ 0), typically 0.2–1.0 for natural text.
    """
    sents = _sentences(doc)
    if len(sents) < 2:
        return 0.0
    lengths = [len([t for t in s if not t.is_space]) for s in sents]
    mean = np.mean(lengths)
    std = np.std(lengths)
    if mean == 0:
        return 0.0
    return float(std / mean)


def syntactic_tree_depth_variance(doc: spacy.tokens.Doc) -> float:
    """
    Variance of the maximum dependency-parse tree depth across sentences.

    AI text keeps tree depth in a narrow band → low variance.
    Human text mixes short declaratives with complex nested clauses.

    Returns: float (≥ 0).
    """
    def _max_depth(root: spacy.tokens.Token) -> int:
        if not list(root.children):
            return 0
        return 1 + max(_max_depth(c) for c in root.children)

    sents = _sentences(doc)
    if len(sents) < 2:
        return 0.0
    depths = []
    for sent in sents:
        root = sent.root
        depths.append(_max_depth(root))
    return float(np.var(depths))


def burstiness_index(doc: spacy.tokens.Doc) -> float:
    """
    Standard deviation of sentence token lengths (Burstiness).

    AI text is monotonic and uniform → low burstiness (low std).
    Human text mixes short punchy sentences with long complex clauses → high burstiness (high std).

    Returns: float (≥ 0).
    """
    sents = _sentences(doc)
    if len(sents) < 2:
        return 0.0
    lengths = [len([t for t in s if not t.is_space]) for s in sents]
    return float(np.std(lengths))


# ===========================================================================
# SECONDARY SIGNALS
# ===========================================================================

def lexical_diversity_mattr(doc: spacy.tokens.Doc, window: int = 50) -> float:
    """
    Moving-Average Type-Token Ratio (MATTR).

    Measures vocabulary richness in a sliding window to eliminate length bias.

    AI favours safe, high-frequency words → low MATTR.
    Human writers vary vocabulary → high MATTR.

    Returns: float in [0, 1].
    """
    tokens = [
        t.text.lower()
        for t in doc
        if t.is_alpha and not t.is_space
    ]
    if len(tokens) < window:
        if not tokens:
            return 0.0
        return len(set(tokens)) / len(tokens)

    ratios = []
    for i in range(len(tokens) - window + 1):
        window_tokens = tokens[i: i + window]
        ratios.append(len(set(window_tokens)) / window)
    return float(np.mean(ratios))


def discourse_connector_density(doc: spacy.tokens.Doc) -> float:
    """
    Rate of discourse/transition connectors per sentence.

    AI overuses connectors ("Furthermore," "Moreover," etc.) to fake coherence.
    Human writers (especially teens) use them sparingly.

    Returns: float (≥ 0), typically 0–0.2.
    """
    sents = _sentences(doc)
    if not sents:
        return 0.0
    text_lower = doc.text.lower()
    total_hits = 0
    for connector in _DISCOURSE_CONNECTORS:
        pattern = r'\b' + re.escape(connector) + r'\b'
        total_hits += len(re.findall(pattern, text_lower))
    return total_hits / len(sents)


def sentence_opening_pos_diversity(doc: spacy.tokens.Doc) -> float:
    """
    Diversity of Part-of-Speech bigrams that open each sentence.

    AI repeats safe patterns (\"The [noun]\", \"I [verb]\", \"This [noun]\").
    Human writers vary openings unpredictably.

    Returns: float in [0, 1] (normalised type-token ratio of opening bigrams).
    """
    sents = _sentences(doc)
    if len(sents) < 2:
        return 0.0
    bigrams = []
    for sent in sents:
        meaningful_tokens = [t for t in sent if not t.is_space]
        if len(meaningful_tokens) >= 2:
            bigrams.append((meaningful_tokens[0].pos_, meaningful_tokens[1].pos_))
        elif len(meaningful_tokens) == 1:
            bigrams.append((meaningful_tokens[0].pos_, "END"))
    if not bigrams:
        return 0.0
    return len(set(bigrams)) / len(bigrams)


# ===========================================================================
# SUPPORTING SIGNAL
# ===========================================================================

def punctuation_entropy(doc: spacy.tokens.Doc) -> float:
    """
    Shannon entropy of punctuation character usage.

    AI sticks to commas and periods → low entropy.
    Human writers use dashes, semicolons, parentheses, ellipses → high entropy.

    Returns: float (≥ 0), typically 0.5–2.5 for natural text.
    """
    punct_chars = [
        t.text
        for t in doc
        if t.is_punct or t.text in string.punctuation
    ]
    if not punct_chars:
        return 0.0
    counts = Counter(punct_chars)
    total = sum(counts.values())
    entropy = -sum((c / total) * math.log2(c / total) for c in counts.values())
    return float(entropy)


# ===========================================================================
# Convenience: run all signals at once
# ===========================================================================

def extract_all(doc: spacy.tokens.Doc) -> dict[str, float]:
    """
    Run all 7 signal extractors and return a named dict.

    Args:
        doc: A spaCy Doc object (must have dep-parse; use en_core_web_sm+).

    Returns:
        dict with keys: slv, stdv, burstiness, mattr, dcd, sopd, punct_entropy
    """
    return {
        "slv": sentence_length_variance(doc),
        "stdv": syntactic_tree_depth_variance(doc),
        "burstiness": burstiness_index(doc),
        "mattr": lexical_diversity_mattr(doc),
        "dcd": discourse_connector_density(doc),
        "sopd": sentence_opening_pos_diversity(doc),
        "punct_entropy": punctuation_entropy(doc),
    }
