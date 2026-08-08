import React, { useEffect, useState } from 'react'

const STEPS = [
  { label: 'Parsing essay text',            detail: 'Breaking your text into words and sentences',              dur: 380 },
  { label: 'Extracting vocabulary',         detail: 'Measuring how many different words are used',              dur: 400 },
  { label: 'Analysing sentence structure',  detail: 'Computing grammar depth and variation across sentences',   dur: 440 },
  { label: 'Checking writing patterns',     detail: 'Scanning transition phrases, punctuation, and rhythm',     dur: 440 },
  { label: 'Comparing to human baselines',  detail: 'Running 7 signals against a corpus of 500+ real essays',  dur: 480 },
  { label: 'Generating report',             detail: 'Calculating your final AI suspicion score',                dur: 560 },
]

export default function ScannerScreen({ wordCount, onComplete }) {
  // phase = number of COMPLETED steps (0 → 6)
  // step[i] is: done if i < phase, active if i === phase, pending if i > phase
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (phase >= STEPS.length) {
      // Small pause so user sees all ticks before transition
      const t = setTimeout(onComplete, 260)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setPhase(p => p + 1), STEPS[phase].dur)
    return () => clearTimeout(t)
  }, [phase, onComplete])

  const progress = phase / STEPS.length

  return (
    <div className="scanner-screen screen-visible" role="status" aria-live="polite" aria-label="Analyzing essay">

      <div className="scanner-center">
        <div className="scanner-card">

          {/* ── Header ── */}
          <div className="scanner-header">
            <div className="scanner-logo-icon" aria-hidden="true">⟁</div>
            <div>
              <div className="scanner-title">Analyzing Essay</div>
              <div className="scanner-sub">
                {wordCount.toLocaleString()} word{wordCount !== 1 ? 's' : ''} · 7 statistical checks
              </div>
            </div>
          </div>

          {/* ── Steps ── */}
          <ol className="scanner-steps" aria-label="Analysis progress">
            {STEPS.map((step, i) => {
              const isDone   = i < phase
              const isActive = i === phase
              return (
                <li
                  key={i}
                  className={`scanner-step ${isDone ? 'done' : isActive ? 'active' : 'pending'}`}
                  aria-label={`${step.label}: ${isDone ? 'complete' : isActive ? 'running' : 'waiting'}`}
                >
                  <div className="scanner-step-icon" aria-hidden="true">
                    {isDone ? '✓' : isActive ? <span className="scanner-step-spinner" /> : <span className="scanner-step-circle" />}
                  </div>
                  <div className="scanner-step-body">
                  <span className="scanner-step-label">{step.label}</span>
                  <span className="scanner-step-detail" style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.2s', display: 'block' }}>
                    {step.detail}
                  </span>
                </div>
                  {isActive && (
                    <span className="scanner-pulse-dots" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                  )}
                </li>
              )
            })}
          </ol>

          {/* ── Progress bar ── */}
          <div className="scanner-progress-wrap">
            <div className="scanner-progress-track" role="progressbar" aria-valuenow={phase} aria-valuemax={STEPS.length}>
              <div className="scanner-progress-fill" style={{ width: `${progress * 100}%` }} />
            </div>
            <p className="scanner-progress-label">
              {phase < STEPS.length
                ? `${phase} of ${STEPS.length} checks complete`
                : 'All checks complete — preparing results…'
              }
            </p>
          </div>

        </div>
      </div>

    </div>
  )
}
