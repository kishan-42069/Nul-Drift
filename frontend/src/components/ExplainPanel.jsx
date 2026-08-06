import React from 'react'

export default function ExplainPanel({ result }) {
  const suspicious = result.signals.filter(s => s.is_suspicious)
  const clean = result.signals.filter(s => !s.is_suspicious)

  return (
    <div className="explain-panel" role="region" aria-label="Analysis explanation">
      <p className="section-label">💡 Reviewer Notes</p>

      {suspicious.length > 0 ? (
        <>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            <strong style={{ color: 'var(--color-high)' }}>{suspicious.length}</strong> of 7 signals flagged as AI-like:
          </p>
          <ul style={{ paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {suspicious.map(s => (
              <li key={s.key} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                <strong style={{ color: 'var(--text-secondary)' }}>{s.name}:</strong>{' '}
                {s.explanation}
              </li>
            ))}
          </ul>
          {clean.length > 0 && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              ✅ {clean.length} signal{clean.length > 1 ? 's' : ''} within human norms
              ({clean.map(s => s.name).join(', ')}).
            </p>
          )}
        </>
      ) : (
        <p style={{ fontSize: '0.8rem', color: 'var(--color-low)' }}>
          ✅ All 7 signals are within normal human ranges.
        </p>
      )}

      <div className="explain-note" style={{ marginTop: '1rem' }}>
        No single signal triggers a verdict. Nul!Drift surfaces statistical evidence
        — a human reviewer makes the final call.
      </div>
    </div>
  )
}
