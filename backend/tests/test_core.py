import pytest
import spacy
from core.signals import extract_all, _DISCOURSE_CONNECTORS, discourse_connector_density
from core.scorer import score

@pytest.fixture(scope="module")
def nlp():
    return spacy.load('en_core_web_sm')

def test_dcd_no_false_positives(nlp):
    # 'enthusiasm' contains 'thus', 'author' contains 'or', etc.
    # The regex word boundary fix should prevent these from counting as connectors.
    text = "The author showed great enthusiasm for the project. Overall, it was a success."
    doc = nlp(text)
    
    # 'overall' is a connector. 'thus' inside 'enthusiasm' should NOT be counted.
    dcd = discourse_connector_density(doc)
    
    # 2 sentences. 1 valid connector ("Overall"). DCD should be 1/2 = 0.5.
    assert dcd == 0.5, f"Expected DCD of 0.5, got {dcd}. Substring matching bug might be present."

def test_extract_all_returns_expected_keys(nlp):
    doc = nlp("This is a simple test sentence. It has two sentences.")
    signals = extract_all(doc)
    
    expected_keys = {'slv', 'stdv', 'burstiness', 'mattr', 'dcd', 'sopd', 'punct_entropy'}
    assert set(signals.keys()) == expected_keys, "extract_all did not return the expected 7 signals."
    for k, v in signals.items():
        assert isinstance(v, float), f"Signal {k} should be a float, got {type(v)}"

def test_scorer_ai_classification(nlp):
    ai_essay = '''Furthermore, this experience has significantly shaped my understanding of leadership and community engagement. Moreover, I have developed a profound appreciation for the importance of collaboration and teamwork across diverse groups. Additionally, this journey has instilled in me a deep sense of personal responsibility towards my local community. Furthermore, the lessons I have learned throughout this process will guide me as I pursue my academic and professional aspirations. In conclusion, I am grateful for the opportunity to contribute meaningfully to society and to leave a lasting positive impact on those around me.'''
    
    doc = nlp(ai_essay)
    raw_signals = extract_all(doc)
    
    word_count = sum(1 for t in doc if t.is_alpha)
    sentence_count = len(list(doc.sents))
    
    res = score(raw_signals, word_count, sentence_count)
    
    assert res.verdict == "High Suspicion", f"Expected AI essay to be High Suspicion, got {res.verdict} with score {res.composite_score}"
    assert res.composite_score > 0.60, "Composite score should be > 0.60 for this highly AI-like text."

def test_scorer_human_classification(nlp):
    human_essay = '''My grandmother kept a tin of buttons on the kitchen counter. That is where I first learned to count—not with flash cards or educational apps, but with her wrinkled hands sorting plastic disks by size while I tried to steal the shiny mother-of-pearl ones. She passed away before I entered high school, but I still keep that tin on my desk today. Looking back, nothing in my life has followed a neat or predictable line. I failed freshman algebra twice, earned a disappointing grade in sophomore English, and eventually stepped away from the varsity swim team mid-season so I could take an evening job bagging groceries at the local market to help my family cover rent.'''
    
    doc = nlp(human_essay)
    raw_signals = extract_all(doc)
    
    word_count = sum(1 for t in doc if t.is_alpha)
    sentence_count = len(list(doc.sents))
    
    res = score(raw_signals, word_count, sentence_count)
    
    assert res.verdict in ["Low Suspicion", "Moderate Suspicion"], f"Expected Human essay to be Low/Moderate Suspicion, got {res.verdict} with score {res.composite_score}"
    assert res.composite_score < 0.60, "Composite score should be < 0.60 for authentic human text."

def test_burstiness_content_word_length(nlp):
    # Burstiness now measures mean content-word length (non-stop-word tokens).
    # AI uses long Latinate nominalizations -> higher score.
    # Human uses short, concrete words -> lower score.
    ai_text = "The implementation demonstrates extraordinary commitment to collaborative engagement and professional aspirations."
    human_text = "She kept a tin of old buttons on the kitchen shelf."

    doc_ai = nlp(ai_text)
    doc_human = nlp(human_text)

    signals_ai = extract_all(doc_ai)
    signals_human = extract_all(doc_human)

    assert signals_ai['burstiness'] > signals_human['burstiness'], (
        f"AI text should have higher content-word length than human text. "
        f"AI={signals_ai['burstiness']:.4f}, Human={signals_human['burstiness']:.4f}"
    )
    # AI text with long nominalizations should be well above the human baseline (6.33)
    assert signals_ai['burstiness'] > 7.0, (
        f"AI nominalization text should score > 7.0, got {signals_ai['burstiness']:.4f}"
    )


def test_baseline_text_is_low_suspicion(nlp):
    # Bug 1 fix: a text scoring at human baseline (z=0) should be "Low Suspicion",
    # not "Moderate Suspicion" (the old sigmoid mapped z=0 -> 0.5).
    from core.baselines import HUMAN_BASELINES
    # Construct raw signals at exactly the baseline means
    baseline_signals = {key: mean for key, (mean, _) in HUMAN_BASELINES.items()}
    res = score(baseline_signals)
    assert res.verdict == "Low Suspicion", (
        f"Text at exact human baseline should be Low Suspicion, "
        f"got {res.verdict} (score={res.composite_score})"
    )
    assert res.composite_score < 0.30, (
        f"Baseline composite should be < 0.30, got {res.composite_score}"
    )


def test_sopd_short_text_dampened(nlp):
    # Bug 4 fix: short texts (few sentences) should NOT get extreme SOPD z-scores.
    # A 3-sentence text with all-unique bigrams should not yield a huge negative z.
    short_text = "Running fast feels amazing. Quietly she waited. Why did he leave?"
    doc = nlp(short_text)

    signals = extract_all(doc)
    from core.scorer import _compute_z
    z = _compute_z("sopd", signals["sopd"])
    # Without dampening, 3 unique bigrams / 3 = 1.0, z = -(1.0-0.70)/0.12 = -2.5
    # With dampening: raw ≈ 0.70 + (1.0-0.70)*0.3 = 0.79, z = -(0.79-0.70)/0.12 ≈ -0.75
    assert abs(z) < 1.5, (
        f"SOPD z-score for a 3-sentence text should be dampened (|z| < 1.5), "
        f"got z={z:.2f} (raw={signals['sopd']:.4f})"
    )


