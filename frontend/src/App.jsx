import React, { useState, useCallback, useRef } from 'react'
import './index.css'
import EssayInput    from './components/EssayInput'
import VerdictCard   from './components/VerdictCard'
import SignalBar     from './components/SignalBar'
import ExplainPanel  from './components/ExplainPanel'
import ScannerScreen from './components/ScannerScreen'
import EssayPanel    from './components/EssayPanel'

export default function App() {
  // screen: 'input' | 'scanning' | 'results'
  const [screen, setScreen]         = useState('input')
  const [result, setResult]         = useState(null)
  const [essayText, setEssayText]   = useState('')
  const [error, setError]           = useState(null)
  const [hoveredSignal, setHoveredSignal] = useState(null)

  // Coordination refs — scanner animation and API call run concurrently;
  // we transition to results only when BOTH have finished.
  const pendingResultRef = useRef(null)
  const animDoneRef      = useRef(false)

  const tryTransition = useCallback(() => {
    if (pendingResultRef.current && animDoneRef.current) {
      setResult(pendingResultRef.current)
      setScreen('results')
    }
  }, [])

  // Called by EssayInput the instant Analyze is clicked (before the fetch)
  const handleScanStart = useCallback((text) => {
    setEssayText(text)
    setError(null)
    pendingResultRef.current = null
    animDoneRef.current      = false
    setScreen('scanning')
  }, [])

  // Called by EssayInput when the API fetch resolves successfully
  const handleResult = useCallback((data) => {
    pendingResultRef.current = data
    tryTransition()
  }, [tryTransition])

  // Called by EssayInput when the API fetch fails
  const handleError = useCallback((msg) => {
    setError(msg)
    pendingResultRef.current = null
    animDoneRef.current      = false
    setScreen('input')
  }, [])

  // Called by ScannerScreen when all 6 steps finish
  const handleScannerComplete = useCallback(() => {
    animDoneRef.current = true
    tryTransition()
  }, [tryTransition])

  const handleBack = useCallback(() => {
    setScreen('input')
    setHoveredSignal(null)
  }, [])

  return (
    <div className="app-root">

      {/* ── Ambient mesh (persists across all screens) ── */}
      <div className="mesh-bg" aria-hidden="true">
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
      </div>

      {/* ══════════════════════════════════════════
          SCREEN 1 — INPUT
      ══════════════════════════════════════════ */}
      <div className={`screen-input ${screen === 'input' ? 'screen-visible' : 'screen-hidden'}`}>
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

        <main className="input-main" role="main">
          <div className="depth-wrapper">
            <div className="input-card">
              <EssayInput
                onScanStart={handleScanStart}
                onResult={handleResult}
                onError={handleError}
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
          SCREEN 1.5 — SCANNER (loading animation)
      ══════════════════════════════════════════ */}
      {screen === 'scanning' && (
        <ScannerScreen
          wordCount={essayText.trim().split(/\s+/).filter(Boolean).length}
          onComplete={handleScannerComplete}
        />
      )}

      {/* ══════════════════════════════════════════
          SCREEN 2 — RESULTS
      ══════════════════════════════════════════ */}
      <div className={`screen-results ${screen === 'results' ? 'screen-visible' : 'screen-hidden'}`}>
        <header className="app-header results-header" role="banner">
          <button
            id="back-to-input-btn"
            className="back-btn"
            onClick={handleBack}
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

        <main className="results-main" role="main" aria-live="polite" aria-label="Analysis results">
          {result && (
            <div className="results-container">

              {/* 1. Verdict card — full width */}
              <VerdictCard result={result} />

              {/* 2. Essay panel + Signal breakdown — side by side on desktop */}
              <div className="results-essay-signals">
                <EssayPanel
                  text={essayText}
                  hoveredSignal={hoveredSignal}
                />

                <section className="results-section" aria-labelledby="signals-heading">
                  <div className="results-section-header">
                    <div>
                      <h2 className="results-section-title" id="signals-heading">Signal Breakdown</h2>
                      <p className="results-section-subtitle">
                        Click any check to expand its explanation and highlight that pattern in your essay.
                      </p>
                    </div>
                    <span className="results-section-badge">
                      {result.signals.filter(s => s.is_suspicious).length} / {result.signals.length} flagged
                    </span>
                  </div>
                  <div className="signals-container">
                    {result.signals.map(sig => (
                      <SignalBar
                        key={sig.key}
                        signal={sig}
                        isHighlighted={hoveredSignal?.key === sig.key}
                        onHover={setHoveredSignal}
                        onHoverEnd={() => setHoveredSignal(null)}
                      />
                    ))}
                  </div>
                </section>
              </div>

              {/* 3. Reviewer notes — full width */}
              <section className="results-section" aria-labelledby="notes-heading">
                <div className="results-section-header">
                  <div>
                    <h2 className="results-section-title" id="notes-heading">Reviewer Notes</h2>
                    <p className="results-section-subtitle">
                      A plain-English summary of what the analysis found and what it means.
                    </p>
                  </div>
                </div>
                <ExplainPanel result={result} />
              </section>

            </div>
          )}
        </main>

        <footer className="app-footer" role="contentinfo">
          Nul!Drift · Local AI-essay detection · 7 statistical signals · No LLM-as-judge ·{' '}
          <span style={{ color: 'var(--text-subtle)' }}>Every flag shows <em>why</em>.</span>
        </footer>
      </div>

    </div>
  )
}
