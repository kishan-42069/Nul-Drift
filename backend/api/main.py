"""
api/main.py
-----------
ProseGuard FastAPI server.

Endpoints:
    POST /analyze   — analyze an essay text
    GET  /health    — liveness check

Run with:
    uvicorn api.main:app --reload --port 8000
"""

from __future__ import annotations

import sys
import os

# Ensure backend/ is on the path when running from project root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dataclasses import asdict
from typing import Annotated

import spacy
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from api.extractors import extract_text_from_pdf, extract_text_from_docx

from core.signals import extract_all
from core.scorer import score

# ---------------------------------------------------------------------------
# Load spaCy model once at startup
# ---------------------------------------------------------------------------
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    raise RuntimeError(
        "spaCy model 'en_core_web_sm' not found. "
        "Run: python -m spacy download en_core_web_sm"
    )

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="ProseGuard API",
    description="Local, explainable AI-generated essay detection. No LLM-as-judge.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------
class AnalyzeRequest(BaseModel):
    text: Annotated[str, Field(min_length=50, max_length=20_000)]


class SignalOut(BaseModel):
    key: str
    name: str
    raw_value: float
    z_score: float
    weight: float
    weight_label: str
    is_suspicious: bool
    explanation: str
    human_baseline_mean: float
    human_baseline_std: float


class AnalyzeResponse(BaseModel):
    composite_score: float
    verdict: str
    signals: list[SignalOut]
    word_count: int
    sentence_count: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model": "en_core_web_sm"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Text must not be empty.")

    doc = nlp(text)

    word_count = sum(1 for t in doc if t.is_alpha)
    sentence_count = len(list(doc.sents))

    raw_signals = extract_all(doc)
    result = score(raw_signals, word_count=word_count, sentence_count=sentence_count)

    signals_out = [
        SignalOut(
            key=s.key,
            name=s.name,
            raw_value=round(s.raw_value, 4),
            z_score=round(s.z_score, 4),
            weight=s.weight,
            weight_label=s.weight_label,
            is_suspicious=s.is_suspicious,
            explanation=s.explanation,
            human_baseline_mean=s.human_baseline_mean,
            human_baseline_std=s.human_baseline_std,
        )
        for s in result.signals
    ]

    return AnalyzeResponse(
        composite_score=result.composite_score,
        verdict=result.verdict,
        signals=signals_out,
        word_count=result.word_count,
        sentence_count=result.sentence_count,
    )

@app.post("/analyze/file", response_model=AnalyzeResponse)
async def analyze_file(file: UploadFile = File(...)):
    filename = file.filename.lower()
    
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to read file.")
        
    text = ""
    if filename.endswith(".pdf"):
        try:
            text = extract_text_from_pdf(content)
        except Exception:
            raise HTTPException(status_code=400, detail="Failed to parse PDF file.")
    elif filename.endswith(".docx") or filename.endswith(".doc"):
        try:
            text = extract_text_from_docx(content)
        except Exception:
            raise HTTPException(status_code=400, detail="Failed to parse Word file.")
    elif filename.endswith(".txt"):
        try:
            text = content.decode("utf-8")
        except Exception:
            raise HTTPException(status_code=400, detail="Failed to decode text file.")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF or Word documents.")

    text = text.strip()
    if len(text) < 50:
        raise HTTPException(status_code=422, detail=f"Text extracted is too short ({len(text)} chars). Must be at least 50 characters.")

    req = AnalyzeRequest(text=text)
    return analyze(req)
