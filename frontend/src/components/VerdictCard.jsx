import React, { useEffect, useRef } from 'react'

const VERDICT_CLASS = {
  'Low Suspicion': 'low',
  'Moderate Suspicion': 'moderate',
  'High Suspicion': 'high',
}

const VERDICT_ICON = {
  'Low Suspicion': '🟢',
  'Moderate Suspicion': '🟡',
  'High Suspicion': '🔴',
}

const CIRCUMFERENCE = 2 * Math.PI * 38 // r=38

export default function VerdictCard({ result }) {
  const cls = VERDICT_CLASS[result.verdict] || 'moderate'
  const icon = VERDICT_ICON[result.verdict] || '⚪'
  const pct = Math.round(result.composite_score * 100)
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE

  return (
    <div className={`verdict-card ${cls}`} role="region" aria-label="Verdict result">
      {/* Radial progress ring */}
      <div className="verdict-ring-wrap">
        <svg className="verdict-ring" width="90" height="90" viewBox="0 0 90 90" aria-hidden="true">
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

      {/* Verdict text */}
      <div className="verdict-info">
        <div className={`verdict-label ${cls}`}>
          {icon} {result.verdict}
        </div>
        <div className="verdict-meta">
          <div>Words: <span>{result.word_count.toLocaleString()}</span></div>
          <div>Sentences: <span>{result.sentence_count}</span></div>
        </div>
        <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {result.verdict === 'Low Suspicion' && 'Statistical profile consistent with human writing.'}
          {result.verdict === 'Moderate Suspicion' && 'Some signals deviate from human norms. Review flagged signals.'}
          {result.verdict === 'High Suspicion' && 'Multiple signals strongly indicate AI-generated prose.'}
        </div>
      </div>
    </div>
  )
}
