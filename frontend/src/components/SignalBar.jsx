import React from 'react'

function getBarClass(zScore) {
  if (zScore > 1.0) return 'suspicious'
  if (zScore > 0.5) return 'warn'
  return 'ok'
}

function getBarWidth(zScore) {
  // Map z-score in [-3, 3] to [0%, 100%]
  const clamped = Math.max(-3, Math.min(3, zScore))
  return Math.round(((clamped + 3) / 6) * 100)
}

const WEIGHT_LABELS = {
  'Primary': '2×',
  'Secondary': '1.5×',
  'Supporting': '1×',
}

export default function SignalBar({ signal }) {
  const barClass = getBarClass(signal.z_score)
  const barWidth = getBarWidth(signal.z_score)
  const zFormatted = signal.z_score >= 0 ? `+${signal.z_score.toFixed(2)}` : signal.z_score.toFixed(2)

  return (
    <div
      className={`signal-item${signal.is_suspicious ? ' suspicious' : ''}`}
      id={`signal-${signal.key}`}
      aria-label={`${signal.name}: ${signal.is_suspicious ? 'flagged' : 'normal'}`}
    >
      <div className="signal-header">
        <span className="signal-name">{signal.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="signal-weight-badge">
            {signal.weight_label} {WEIGHT_LABELS[signal.weight_label] || ''}
          </span>
          <span className="signal-flag" aria-hidden="true">
            {signal.is_suspicious ? '🚩' : '✅'}
          </span>
        </div>
      </div>

      <div className="signal-bar-track" aria-hidden="true">
        <div
          className={`signal-bar-fill ${barClass}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <div className="signal-footer">
        <p className="signal-explanation">{signal.explanation}</p>
        <div className="signal-vals">
          <span style={{ color: 'var(--text-muted)' }}>raw {signal.raw_value.toFixed(3)}</span>
          <span className={`zscore ${barClass}`}> z={zFormatted}</span>
        </div>
      </div>
    </div>
  )
}
