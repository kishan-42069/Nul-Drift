import React, { useState, useCallback } from 'react'
import './index.css'
import EssayInput from './components/EssayInput'
import VerdictCard from './components/VerdictCard'
import SignalBar from './components/SignalBar'
import ExplainPanel from './components/ExplainPanel'

export default function App() {
  const [screen, setScreen]   = useState('input')   // 'input' | 'results'
  const [result, setResult]   = useState(null)
  const [error,  setError]    = useState(null)
  const [loading, setLoading] = useState(false)

  const handleResult  = useCallback((data) => { setResult(data); setScreen('results') }, [])
  const handleError   = useCallback((msg)  => setError(msg),   [])
  const handleLoading = useCallback((st)   => setLoading(st),  [])

  return (
    <div className="app-root">

      {/* ══════════════════════════════════════════
          SCREEN 1 — INPUT
      ══════════════════════════════════════════ */}
      <div className={`screen-input ${screen === 'input' ? 'screen-visible' : 'screen-hidden'}`}>

        {/* ── Floating animated background shapes ── */}
        <div className="floating-bg" aria-hidden="true">
          {/* Blobs */}
          <div className="shape blob blob-1" />
          <div className="shape blob blob-2" />
          <div className="shape blob blob-3" />
          {/* Rings */}
          <div className="shape ring ring-1" />
          <div className="shape ring ring-2" />
          <div className="shape ring ring-3" />
          <div className="shape ring ring-4" />
          {/* Diamonds */}
          <div className="shape diamond diamond-1" />
          <div className="shape diamond diamond-2" />
          <div className="shape diamond diamond-3" />
          {/* Dots */}
          <div className="shape dot dot-1" />
          <div className="shape dot dot-2" />
          <div className="shape dot dot-3" />
          <div className="shape dot dot-4" />
          <div className="shape dot dot-5" />
          {/* Triangles */}
          <div className="shape tri tri-1" />
          <div className="shape tri tri-2" />
        </div>

        {/* ── Header ── */}
        <header className="app-header" role="banner">
          <div className="logo">
            <div className="logo-icon" aria-hidden="true">⟁</div>
            <div>
              <div className="logo-text">Nul!Drift</div>
              <div className="logo-tagline">AI Essay Detection</div>
            </div>
          </div>
          <div className="header-badge">100% Local · No APIs · 7 Signals</div>
        </header>

        {/* ── Input main ── */}
        <main className="input-main" role="main">
          {/* Depth-effect card */}
          <div className="depth-wrapper">
            <div className="input-card">
              <EssayInput
                onResult={handleResult}
                onError={handleError}
                onLoading={handleLoading}
              />
              {error && (
                <div className="error-banner" role="alert">⚠️ {error}</div>
              )}
            </div>
          </div>
          <p className="input-hint">
            Paste any essay · minimum 50 characters · 7 signals run entirely locally
          </p>
        </main>
      </div>

      {/* ══════════════════════════════════════════
          SCREEN 2 — RESULTS
      ══════════════════════════════════════════ */}
      <div className={`screen-results ${screen === 'results' ? 'screen-visible' : 'screen-hidden'}`}>

        {/* ── Results header ── */}
        <header className="app-header results-header" role="banner">
          <button
            id="back-to-input-btn"
            className="back-btn"
            onClick={() => setScreen('input')}
            aria-label="Go back to essay input"
          >
            ← Back
          </button>
          <div className="logo">
            <div className="logo-icon" aria-hidden="true">⟁</div>
            <div>
              <div className="logo-text">Nul!Drift</div>
              <div className="logo-tagline">Analysis Results</div>
            </div>
          </div>
          <div className="header-badge">100% Local · No APIs · 7 Signals</div>
        </header>

        {/* ── Results content ── */}
        <main className="results-main" role="main" aria-live="polite" aria-label="Analysis results">
          {result && (
            <div className="results-container">
              {/* Verdict ring + summary */}
              <VerdictCard result={result} />

              {/* Signal breakdown */}
              <div className="results-card">
                <p className="section-label">📊 Signal Breakdown</p>
                <div className="signals-container">
                  {result.signals.map(sig => (
                    <SignalBar key={sig.key} signal={sig} />
                  ))}
                </div>
              </div>

              {/* Reviewer notes */}
              <ExplainPanel result={result} />
            </div>
          )}
        </main>

        <footer className="app-footer" role="contentinfo">
          Nul!Drift · Local AI-essay detection · 7 statistical signals · No LLM-as-judge ·{' '}
          <span style={{ color: 'var(--text-muted)' }}>Every flag shows <em>why</em>.</span>
        </footer>
      </div>

    </div>
  )
}
