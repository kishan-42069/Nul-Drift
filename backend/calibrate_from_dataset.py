#!/usr/bin/env python3
"""
calibrate_from_dataset.py
--------------------------
Recalibrate all ProseGuard parameters from the labeled essay dataset.

Steps:
  1. Load train_v2_drcat_02.csv (label 0 = human, label 1 = AI).
  2. Sample 3,000 human + 3,000 AI essays (stratified, shuffled).
  3. Extract all 7 signals from each essay via spaCy.
  4. Compute empirical (mean, std) baselines from the human subset.
  5. Compute Cohen's d effect sizes (human vs AI) per signal.
  6. Derive optimal signal weights from effect sizes.
  7. Fit sigmoid (k, offset) via logistic regression on weighted_mean_z.
  8. Auto-patch baselines.py and scorer.py with the new values.

Usage:
  cd backend/
  python calibrate_from_dataset.py
"""

from __future__ import annotations

import csv
import math
import os
import random
import re
import sys
import time
from pathlib import Path

import numpy as np
import spacy

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BACKEND_DIR = Path(__file__).parent
DATASET_PATH = BACKEND_DIR / "data" / "train_v2_drcat_02.csv"
BASELINES_PATH = BACKEND_DIR / "core" / "baselines.py"
SCORER_PATH = BACKEND_DIR / "core" / "scorer.py"

SAMPLE_PER_CLASS = 3000
MIN_TEXT_LEN = 200
RANDOM_SEED = 42

# ---------------------------------------------------------------------------
sys.path.insert(0, str(BACKEND_DIR))
from core.signals import extract_all
from core.baselines import INVERTED_SIGNALS, NORMAL_SIGNALS, SIGNAL_WEIGHTS as CURRENT_WEIGHTS

# ---------------------------------------------------------------------------

def load_sample(path, n_human, n_ai, seed=RANDOM_SEED):
    human_texts, ai_texts = [], []
    print(f"Loading CSV: {path} ...")
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            text = row["text"].strip()
            if len(text) < MIN_TEXT_LEN:
                continue
            label = row["label"]
            if label == "0":
                human_texts.append(text)
            elif label == "1":
                ai_texts.append(text)
    rng = random.Random(seed)
    rng.shuffle(human_texts)
    rng.shuffle(ai_texts)
    human_sample = human_texts[:n_human]
    ai_sample = ai_texts[:n_ai]
    print(f"  Sampled {len(human_sample)} human + {len(ai_sample)} AI essays.")
    return human_sample, ai_sample


def extract_signals_batch(nlp, texts, label):
    results = []
    n = len(texts)
    t0 = time.time()
    for i, text in enumerate(texts):
        if i % 200 == 0 and i > 0:
            elapsed = time.time() - t0
            eta = elapsed / i * (n - i)
            print(f"  [{label}] {i}/{n}  ({elapsed:.0f}s elapsed, ~{eta:.0f}s remaining)")
        try:
            doc = nlp(text[:5000])
            signals = extract_all(doc)
            results.append(signals)
        except Exception as e:
            print(f"  Warning: skipping essay {i} ({e})")
    elapsed = time.time() - t0
    print(f"  [{label}] Done. {len(results)}/{n} processed in {elapsed:.0f}s.")
    return results


def cohen_d(human_vals, ai_vals):
    h = np.array(human_vals)
    a = np.array(ai_vals)
    pooled_std = math.sqrt((np.var(h, ddof=1) + np.var(a, ddof=1)) / 2)
    if pooled_std == 0:
        return 0.0
    return float((np.mean(a) - np.mean(h)) / pooled_std)


def fit_sigmoid(weighted_zs, labels):
    try:
        from scipy.optimize import minimize
        def neg_log_likelihood(params):
            k, offset = params
            total = 0.0
            for z, y in zip(weighted_zs, labels):
                logit = max(-30, min(30, k * z - offset))
                p = 1.0 / (1.0 + math.exp(-logit))
                p = max(1e-9, min(1 - 1e-9, p))
                total -= y * math.log(p) + (1 - y) * math.log(1 - p)
            return total
        result = minimize(neg_log_likelihood, x0=[1.7, 1.5], method="Nelder-Mead",
                          options={"xatol": 1e-5, "fatol": 1e-5, "maxiter": 5000})
        k, offset = result.x
    except ImportError:
        print("  scipy not found, using grid search fallback...")
        best_nll = float("inf")
        k, offset = 1.7, 1.5
        for k_try in np.arange(0.5, 4.0, 0.15):
            for o_try in np.arange(-2.0, 5.0, 0.15):
                nll = 0.0
                for z, y in zip(weighted_zs, labels):
                    logit = max(-30, min(30, k_try * z - o_try))
                    p = 1.0 / (1.0 + math.exp(-logit))
                    p = max(1e-9, min(1 - 1e-9, p))
                    nll -= y * math.log(p) + (1 - y) * math.log(1 - p)
                if nll < best_nll:
                    best_nll = nll
                    k, offset = k_try, o_try
    return round(float(k), 4), round(float(offset), 4)


def derive_weights(effect_sizes, current_weights):
    primary   = {"slv", "stdv", "burstiness"}
    secondary = {"mattr", "dcd", "sopd"}
    supporting = {"punct_entropy"}
    tiers = [
        (primary, 2.0),
        (secondary, 1.5),
        (supporting, 1.0),
    ]
    new_weights = {}
    for keys, base_weight in tiers:
        tier_effects = {k: abs(effect_sizes.get(k, 0.0)) for k in keys}
        max_effect = max(tier_effects.values()) if tier_effects else 1.0
        if max_effect == 0:
            max_effect = 1.0
        for k in keys:
            relative = tier_effects[k] / max_effect
            scaled = base_weight * (0.7 + 0.6 * relative)
            new_weights[k] = round(scaled, 2)
    return new_weights


def patch_baselines(baselines, weights):
    with open(BASELINES_PATH, "r") as f:
        content = f.read()

    comments = {
        "slv":          "# Sentence Length Variance — humans show high coefficient-of-variation",
        "stdv":         "# Syntactic Tree Depth Variance (std) — humans mix shallow + deep clauses",
        "burstiness":   "# Burstiness Index — mean content-word length; higher = more Latinate/AI-like",
        "mattr":        "# MATTR — humans use diverse vocabulary relative to window size",
        "dcd":          "# Discourse Connector Density — humans use connectors sparingly",
        "sopd":         "# Sentence Opening POS Diversity — humans vary sentence starts",
        "punct_entropy":"# Punctuation Entropy — humans use varied punctuation expressively",
    }
    groups = [
        ("# Primary Signals (weight \u00d7 2)", ["slv", "stdv", "burstiness"]),
        ("# Secondary Signals (weight \u00d7 1.5)", ["mattr", "dcd", "sopd"]),
        ("# Supporting Signal (weight \u00d7 1)", ["punct_entropy"]),
    ]
    bl_body = "HUMAN_BASELINES: dict[str, tuple[float, float]] = {\n"
    for group_comment, keys in groups:
        bl_body += f"    {group_comment}\n"
        for k in keys:
            mean, std = baselines[k]
            bl_body += f"    {comments[k]}\n"
            bl_body += f'    "{k}": ({mean}, {std}),\n\n'
    bl_body = bl_body.rstrip("\n") + "\n}"

    content = re.sub(
        r"HUMAN_BASELINES: dict\[str, tuple\[float, float\]\] = \{.*?\}",
        bl_body, content, flags=re.DOTALL,
    )

    wt_body = "SIGNAL_WEIGHTS: dict[str, float] = {\n"
    wt_body += "    # Primary\n"
    for k in ["slv", "stdv", "burstiness"]:
        wt_body += f'    "{k}": {weights[k]},\n'
    wt_body += "    # Secondary\n"
    for k in ["mattr", "dcd", "sopd"]:
        wt_body += f'    "{k}": {weights[k]},\n'
    wt_body += "    # Supporting\n"
    wt_body += f'    "punct_entropy": {weights["punct_entropy"]},\n'
    wt_body += "}"

    content = re.sub(
        r"SIGNAL_WEIGHTS: dict\[str, float\] = \{.*?\}",
        wt_body, content, flags=re.DOTALL,
    )

    with open(BASELINES_PATH, "w") as f:
        f.write(content)
    print(f"Updated {BASELINES_PATH}")


def patch_scorer(k, offset):
    with open(SCORER_PATH, "r") as f:
        content = f.read()

    def inv_sig(p):
        return (offset + math.log(p / (1 - p))) / k

    z_mod  = round(inv_sig(0.30), 2)
    z_high = round(inv_sig(0.60), 2)
    z_base = round(1.0 / (1.0 + math.exp(offset)), 4)

    old_pattern = r"    # Shifted sigmoid.*?\n    composite = _sigmoid\(.*?\)"
    new_block = (
        f"    # Shifted sigmoid (calibrated from dataset):\n"
        f"    # z=0 (baseline) -> ~{z_base} (Low Suspicion),\n"
        f"    # z~{z_mod} -> 0.30 (Moderate threshold), z~{z_high} -> 0.60 (High threshold)\n"
        f"    composite = _sigmoid({k} * weighted_mean_z - {offset})"
    )

    content = re.sub(old_pattern, new_block, content, flags=re.DOTALL)

    with open(SCORER_PATH, "w") as f:
        f.write(content)
    print(f"Updated {SCORER_PATH}")


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    if not DATASET_PATH.exists():
        print(f"ERROR: Dataset not found at {DATASET_PATH}")
        sys.exit(1)

    print("=" * 70)
    print("ProseGuard Dataset Calibration")
    print("=" * 70)

    print("\nLoading spaCy model...")
    nlp = spacy.load("en_core_web_sm")
    nlp.max_length = 6000

    human_texts, ai_texts = load_sample(DATASET_PATH, SAMPLE_PER_CLASS, SAMPLE_PER_CLASS)

    print(f"\nExtracting signals from {len(human_texts)} human essays...")
    human_signals = extract_signals_batch(nlp, human_texts, "Human")

    print(f"\nExtracting signals from {len(ai_texts)} AI essays...")
    ai_signals = extract_signals_batch(nlp, ai_texts, "AI")

    all_keys = ["slv", "stdv", "burstiness", "mattr", "dcd", "sopd", "punct_entropy"]
    human_arrays = {k: [] for k in all_keys}
    ai_arrays    = {k: [] for k in all_keys}

    for sig_dict in human_signals:
        for k in all_keys:
            if k in sig_dict:
                human_arrays[k].append(sig_dict[k])
    for sig_dict in ai_signals:
        for k in all_keys:
            if k in sig_dict:
                ai_arrays[k].append(sig_dict[k])

    print("\n" + "=" * 70)
    print("EMPIRICAL BASELINES (Human corpus)")
    print("=" * 70)
    new_baselines = {}
    effect_sizes  = {}
    for k in all_keys:
        h = np.array(human_arrays[k])
        a = np.array(ai_arrays[k])
        mean = round(float(np.mean(h)), 4)
        std  = max(round(float(np.std(h)), 4), 0.0001)
        new_baselines[k] = (mean, std)
        d = cohen_d(list(h), list(a))
        effect_sizes[k] = d
        direction = "INVERTED" if k in INVERTED_SIGNALS else "NORMAL"
        print(f"  {k:15s}: mean={mean:.4f}  std={std:.4f}  d={d:+.3f}  [{direction}]")

    print("\n" + "=" * 70)
    print("DERIVED SIGNAL WEIGHTS")
    print("=" * 70)
    new_weights = derive_weights(effect_sizes, CURRENT_WEIGHTS)
    for k in all_keys:
        print(f"  {k:15s}: {CURRENT_WEIGHTS.get(k, '?')} -> {new_weights[k]}   (|d|={abs(effect_sizes[k]):.3f})")

    print("\nComputing weighted z-scores for sigmoid fitting...")
    def compute_wz(sig_dict, baselines, weights):
        wz_sum = w_sum = 0.0
        for k, raw in sig_dict.items():
            mean, std = baselines.get(k, (0.0, 1.0))
            z = (raw - mean) / std
            if k in INVERTED_SIGNALS:
                z = -z
            z = max(-3.0, min(3.0, z))
            w = weights.get(k, 1.0)
            wz_sum += z * w
            w_sum  += w
        return wz_sum / w_sum if w_sum > 0 else 0.0

    all_wz, all_labels = [], []
    for sig_dict in human_signals:
        all_wz.append(compute_wz(sig_dict, new_baselines, new_weights))
        all_labels.append(0)
    for sig_dict in ai_signals:
        all_wz.append(compute_wz(sig_dict, new_baselines, new_weights))
        all_labels.append(1)

    h_wz = [z for z, l in zip(all_wz, all_labels) if l == 0]
    a_wz = [z for z, l in zip(all_wz, all_labels) if l == 1]
    print(f"  Human wz: mean={np.mean(h_wz):.3f}  std={np.std(h_wz):.3f}")
    print(f"  AI    wz: mean={np.mean(a_wz):.3f}  std={np.std(a_wz):.3f}")

    print("\nFitting sigmoid...")
    k, offset = fit_sigmoid(all_wz, all_labels)
    print(f"  Fitted: k={k}, offset={offset}")

    correct = sum(
        1 for wz, label in zip(all_wz, all_labels)
        if (1 if 1.0/(1.0+math.exp(-max(-30,min(30,k*wz-offset)))) >= 0.5 else 0) == label
    )
    accuracy = correct / len(all_labels)
    print(f"  Sample accuracy: {accuracy:.1%}  ({correct}/{len(all_labels)})")

    print("\n" + "=" * 70)
    print("Writing calibrated values...")
    patch_baselines(new_baselines, new_weights)
    patch_scorer(k, offset)

    print("\n Calibration complete!")
    print(f"   Sample accuracy: {accuracy:.1%}")
    print("\nNext: python -m pytest tests/test_core.py -v")
