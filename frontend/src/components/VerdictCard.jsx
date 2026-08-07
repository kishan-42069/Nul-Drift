import React from 'react'

const VERDICT_CLASS = {
  'Low Suspicion':      'low',
  'Moderate Suspicion': 'moderate',
  'High Suspicion':     'high',
}

const VERDICT_DESC = {
  'Low Suspicion':      'Statistical profile consistent with human writing patterns.',
  'Moderate Suspicion': 'Some signals deviate from human norms — review flagged indicators.',
  'High Suspicion':     'Multiple signals strongly indicate AI-generated prose.',
}

const CIRCUMFERENCE = 2 * Math.PI * 38 // r=38

export default function VerdictCard({ result }) {
  const cls  = VERDICT_CLASS[result.verdict] || 'moderate'
  const desc = VERDICT_DESC[result.verdict]  || ''
  const pct  = Math.round(result.composite_score * 100)
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE

  return (
    <div className={`verdict-card ${cls}`} role="region" aria-label="Verdict result">

      {/* Radial progress ring */}
      <div className="verdict-ring-wrap">
        <svg
          className="verdict-ring"
          width="100" height="100"
          viewBox="0 0 90 90"
          aria-hidden="true"
        >
          <circle className="ring-bg" cx="45" cy="45" r="38" />
          <circle
            className={`ring-fill ${cls}`}
            cx="45" cy="45" r="38"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="ring-label">
          <span className={`ring-pct ${cls}`}>{pct}%</span>
          <span className="ring-sub">AI risk</span>
        </div>
      </div>

      {/* Verdict text block */}
      <div className="verdict-info">
        <div className={`verdict-label ${cls}`}>
          {result.verdict}
        </div>
        <p className="verdict-desc">{desc}</p>
        <div className="verdict-meta">
          <span className="verdict-chip">
            <strong>{result.word_count.toLocaleString()}</strong> words
          </span>
          <span className="verdict-chip">
            <strong>{result.sentence_count}</strong> sentences
          </span>
          <span className="verdict-chip">
            <strong>{result.signals.filter(s => s.is_suspicious).length}</strong> / 7 flagged
          </span>
        </div>
      </div>

    </div>
  )
}
