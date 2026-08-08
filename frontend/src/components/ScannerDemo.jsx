import React, { useEffect, useState } from 'react'

const STEPS = [
  { label: 'Parsing essay text',            detail: 'Breaking your text into words and sentences',              dur: 800 },
  { label: 'Extracting vocabulary',         detail: 'Measuring how many different words are used',              dur: 800 },
  { label: 'Analysing sentence structure',  detail: 'Computing grammar depth and variation across sentences',   dur: 800 },
  { label: 'Checking writing patterns',     detail: 'Scanning transition phrases, punctuation, and rhythm',     dur: 800 },
  { label: 'Comparing to human baselines',  detail: 'Running 7 signals against a corpus of 500+ real essays',  dur: 1000 },
  { label: 'Generating report',             detail: 'Calculating your final AI suspicion score',                dur: 1000 },
]

export default function ScannerDemo() {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    let t;
    if (phase >= STEPS.length) {
      t = setTimeout(() => {
        setPhase(0)
      }, 2000) // Reset after 2 seconds
    } else {
      t = setTimeout(() => setPhase(p => p + 1), STEPS[phase].dur)
    }
    return () => clearTimeout(t)
  }, [phase])

  const progress = phase / STEPS.length

  return (
    <div className="scanner-demo" aria-hidden="true">
      <div className="scanner-card">
        {/* ── Header ── */}
        <div className="scanner-header">
          <div className="scanner-logo-icon">⟁</div>
          <div>
            <div className="scanner-title">Live Analysis Demo</div>
            <div className="scanner-sub">
              Analyzing sample essay · 7 statistical checks
            </div>
          </div>
        </div>

        {/* ── Steps ── */}
        <ol className="scanner-steps">
          {STEPS.map((step, i) => {
            const isDone   = i < phase
            const isActive = i === phase
            return (
              <li
                key={i}
                className={`scanner-step ${isDone ? 'done' : isActive ? 'active' : 'pending'}`}
              >
                <div className="scanner-step-icon">
                  {isDone ? '✓' : isActive ? <span className="scanner-step-spinner" /> : <span className="scanner-step-circle" />}
                </div>
                <div className="scanner-step-body">
                  <span className="scanner-step-label">{step.label}</span>
                  <span className="scanner-step-detail" style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.2s', display: 'block' }}>
                    {step.detail}
                  </span>
                </div>
                {isActive && (
                  <span className="scanner-pulse-dots">
                    <span /><span /><span />
                  </span>
                )}
              </li>
            )
          })}
        </ol>

        {/* ── Progress bar ── */}
        <div className="scanner-progress-wrap">
          <div className="scanner-progress-track">
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
  )
}
