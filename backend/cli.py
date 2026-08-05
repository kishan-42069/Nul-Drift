#!/usr/bin/env python3
"""
cli.py
------
ProseGuard command-line interface.

Usage:
    python cli.py analyze essay.txt
    python cli.py analyze --text "Furthermore, the essay demonstrates..."
    python cli.py analyze essay.txt --json
    cat essay.txt | python cli.py analyze -
"""

from __future__ import annotations

import json
import sys
import os

# Make sure backend/ is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.progress import BarColumn, Progress, TextColumn
from rich import box
from rich.text import Text
import spacy

from core.signals import extract_all
from core.scorer import score, AnalysisResult

app = typer.Typer(
    name="proseguard",
    help="🛡️  ProseGuard — Local AI-essay detection. No LLM-as-judge.",
    rich_markup_mode="rich",
)
console = Console()

# ---------------------------------------------------------------------------
# Load spaCy once
# ---------------------------------------------------------------------------
def _load_nlp():
    try:
        return spacy.load("en_core_web_sm")
    except OSError:
        console.print(
            "[bold red]Error:[/] spaCy model not found. Run:\n"
            "  python -m spacy download en_core_web_sm",
            style="red",
        )
        raise typer.Exit(code=1)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
VERDICT_COLORS = {
    "Low Suspicion": "green",
    "Moderate Suspicion": "yellow",
    "High Suspicion": "red",
}

VERDICT_ICONS = {
    "Low Suspicion": "🟢",
    "Moderate Suspicion": "🟡",
    "High Suspicion": "🔴",
}


def _render_verdict_banner(result: AnalysisResult) -> None:
    color = VERDICT_COLORS.get(result.verdict, "white")
    icon = VERDICT_ICONS.get(result.verdict, "⚪")
    pct = int(result.composite_score * 100)
    title = f"{icon} {result.verdict}"
    body = (
        f"[bold]Composite Score:[/] [{color}]{pct}%[/]\n"
        f"[dim]Words: {result.word_count}  |  Sentences: {result.sentence_count}[/]"
    )
    console.print(
        Panel(body, title=f"[bold {color}]{title}[/]", border_style=color, expand=False)
    )


def _render_signal_table(result: AnalysisResult) -> None:
    table = Table(
        title="Signal Breakdown",
        box=box.ROUNDED,
        show_header=True,
        header_style="bold cyan",
    )
    table.add_column("Signal", style="bold", min_width=28)
    table.add_column("Weight", justify="center", min_width=10)
    table.add_column("Raw Value", justify="right", min_width=10)
    table.add_column("Z-Score", justify="right", min_width=10)
    table.add_column("Flag", justify="center", min_width=6)
    table.add_column("Explanation", min_width=40)

    for sig in result.signals:
        flag = "🚩" if sig.is_suspicious else "✅"
        z_color = "red" if sig.z_score > 1.0 else ("yellow" if sig.z_score > 0.5 else "green")
        table.add_row(
            sig.name,
            f"[dim]{sig.weight_label} ×{sig.weight}[/]",
            f"{sig.raw_value:.4f}",
            f"[{z_color}]{sig.z_score:+.2f}[/]",
            flag,
            f"[dim]{sig.explanation}[/]",
        )

    console.print(table)


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------
@app.command()
def analyze(
    source: str = typer.Argument(
        ..., help="Path to a text file, or '-' to read stdin, or use --text."
    ),
    text: str = typer.Option(
        None, "--text", "-t", help="Inline text to analyze instead of a file."
    ),
    output_json: bool = typer.Option(
        False, "--json", "-j", help="Output machine-readable JSON."
    ),
) -> None:
    """
    Analyze a college essay for AI-generation signals.
    """
    # Read text
    if text:
        essay_text = text
    elif source == "-":
        essay_text = sys.stdin.read()
    else:
        path = source
        if not os.path.isfile(path):
            console.print(f"[red]File not found:[/] {path}")
            raise typer.Exit(code=1)
        with open(path, "r", encoding="utf-8") as f:
            essay_text = f.read()

    essay_text = essay_text.strip()
    if len(essay_text) < 50:
        console.print("[red]Error:[/] Text is too short (minimum 50 characters).")
        raise typer.Exit(code=1)

    nlp = _load_nlp()

    with console.status("[bold cyan]Analyzing essay...[/]", spinner="dots"):
        doc = nlp(essay_text)
        word_count = sum(1 for t in doc if t.is_alpha)
        sentence_count = len(list(doc.sents))
        raw_signals = extract_all(doc)
        result = score(raw_signals, word_count=word_count, sentence_count=sentence_count)

    if output_json:
        out = {
            "composite_score": result.composite_score,
            "verdict": result.verdict,
            "word_count": result.word_count,
            "sentence_count": result.sentence_count,
            "signals": [
                {
                    "key": s.key,
                    "name": s.name,
                    "raw_value": s.raw_value,
                    "z_score": s.z_score,
                    "weight": s.weight,
                    "is_suspicious": s.is_suspicious,
                    "explanation": s.explanation,
                }
                for s in result.signals
            ],
        }
        print(json.dumps(out, indent=2))
        return

    console.print()
    _render_verdict_banner(result)
    console.print()
    _render_signal_table(result)
    console.print()
    console.print(
        "[dim italic]Note: No single signal triggers a verdict. "
        "ProseGuard surfaces evidence — a human reviewer makes the final call.[/]"
    )
    console.print()


if __name__ == "__main__":
    app()
