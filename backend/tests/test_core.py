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

def test_burstiness_std_formula(nlp):
    # Burstiness should be the standard deviation of sentence lengths.
    # Text with exactly equal sentence lengths should have burstiness = 0.
    text = "This is a short sentence. Here is another one now."
    doc = nlp(text)
    
    signals = extract_all(doc)
    # Sentence 1: 5 words (not counting space). Sentence 2: 5 words.
    # Wait, let's check tokens: ["This", "is", "a", "short", "sentence", "."] -> length 6
    # ["Here", "is", "another", "one", "now", "."] -> length 6
    # Standard deviation should be 0.
    assert signals['burstiness'] == 0.0, f"Expected burstiness to be 0 for uniform sentences, got {signals['burstiness']}"


