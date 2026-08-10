# Nul!Drift — AI-Generated Essay Detection Pipeline

> A local, explainable feature-extraction system for detecting AI-generated prose in college admissions essays. No LLM-as-judge. Every flag shows *why*.

---

## Philosophy
Nul!Drift detects AI writing by measuring statistical smoothness. Human writers are rhythmically unpredictable; AI optimizes for predictable token distributions. We use 7 local, concrete statistical signals on passages to find these differences.

---

## Signal Catalogue

### Primary Signals (Deep Structural Properties)
1. **Sentence-Length Variance (SLV):** Coefficient of variation of sentence lengths. AI has low variance (predictable lengths); humans have high variance (choppy to complex).
2. **Syntactic Tree Depth Variance (STDV):** Variance of maximum dependency-parse tree depths. AI stays in a narrow complexity band; humans mix simple and highly nested clauses.
3. **Burstiness Index:** Fraction of words appearing exactly once (hapax legomena). AI recycles words; humans use idiosyncratic descriptors once and move on.

### Secondary Signals (Lexical/Stylistic Choices)
4. **Lexical Diversity (MATTR):** Moving-Average Type-Token Ratio. AI relies on safe, high-frequency words; humans use diverse vocabulary.
5. **Discourse Connector Density (DCD):** Rate of transition words ("Furthermore," "Moreover"). AI overuses them for coherence; humans (especially teens) use them sparsely.
6. **Sentence-Opening POS Diversity (SOPD):** Variety of Part-of-Speech bigrams starting sentences. AI repeats structures ("The [noun]", "I [verb]"); humans vary openings.

### Supporting Signal
7. **Punctuation Entropy:** Shannon entropy of punctuation usage. AI sticks to commas and periods; humans use dashes, semicolons, and parentheses expressively.

---

## Verdict Strategy
Signals are combined via a weighted z-score normalisation against human baselines.
- **Primary Signals:** 2x weight
- **Secondary Signals:** 1.5x weight
- **Supporting Signal:** 1x weight

**Thresholds:**
- Composite < 0.3: **Low suspicion** (Human)
- Composite 0.3–0.6: **Moderate suspicion**
- Composite > 0.6: **High suspicion** (AI)

*Note: No single signal triggers a verdict. The system surfaces evidence; a human reviewer makes the final call.*

---

## Tech Stack
- **Backend/Logic:** Python (latest), spaCy (`en_core_web_sm`), NumPy. 100% local, no APIs.
- **Interfaces:**
  - CLI application.
  - Modern Web Application (Vite/React + FastAPI/Flask) for a premium reviewer experience.
