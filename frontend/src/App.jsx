import React, { useState, useCallback } from 'react'
import './index.css'
import EssayInput from './components/EssayInput'
import VerdictCard from './components/VerdictCard'
import SignalBar from './components/SignalBar'
import ExplainPanel from './components/ExplainPanel'

export default function App() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleResult = useCallback((data) => setResult(data), [])
  const handleError = useCallback((msg) => setError(msg), [])
  const handleLoading = useCallback((state) => setLoading(state), [])

  return (
    <>
      {/* Animated background orbs */}
      <div className="bg-orbs" aria-hidden="true">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      <div className="app-root">
        {/* Header */}
        <header className="app-header" role="banner">
          <div className="logo">
            <div className="logo-icon" aria-hidden="true">🛡️</div>
            <div>
              <div className="logo-text">ProseGuard</div>
              <div className="logo-tagline">AI Essay Detection</div>
            </div>
          </div>
          <div className="header-badge">100% Local · No APIs · 7 Signals</div>
        </header>

        {/* Main content: two-column layout */}
        <main className="main-content" role="main">
          {/* Left column: input */}
          <EssayInput
            onResult={handleResult}
            onError={handleError}
            onLoading={handleLoading}
          />

          {/* Right column: results */}
          <div className="results-panel" aria-live="polite" aria-label="Analysis results">
            {error && (
              <div className="error-banner" role="alert">
                ⚠️ {error}
              </div>
            )}

            {!result && !loading && !error && (
              <div className="glass-card empty-state">
                <div className="empty-state-icon" aria-hidden="true">🔍</div>
                <p>Paste an essay on the left and click <strong>Analyze Essay</strong> to see the full signal breakdown.</p>
              </div>
            )}

            {loading && !result && (
              <div className="glass-card empty-state">
                <div className="btn-spinner" style={{ width: 32, height: 32, borderWidth: 3 }} aria-hidden="true" />
                <p>Running 7 statistical signals…</p>
              </div>
            )}

            {result && (
              <>
                {/* Verdict */}
                <VerdictCard result={result} />

                {/* Signal breakdown */}
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                  <p className="section-label">📊 Signal Breakdown</p>
                  <div className="signals-container">
                    {result.signals.map(sig => (
                      <SignalBar key={sig.key} signal={sig} />
                    ))}
                  </div>
                </div>

                {/* Explain panel */}
                <ExplainPanel result={result} />
              </>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="app-footer" role="contentinfo">
          ProseGuard · Local AI-essay detection · 7 statistical signals · No LLM-as-judge ·{' '}
          <span style={{ color: 'var(--text-muted)' }}>Every flag shows <em>why</em>.</span>
        </footer>
      </div>
    </>
  )
}
