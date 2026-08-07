import React from 'react'

// Map signal keys to plain-English names
const FRIENDLY_NAMES = {
  slv:           'Sentence Length Variety',
  stdv:          'Sentence Complexity Mix',
  burstiness:    'Word Difficulty Level',
  mattr:         'Vocabulary Range',
  dcd:           'Use of Transition Phrases',
  sopd:          'How Sentences Start',
  punct_entropy: 'Punctuation Variety',
}

// What it means when something is flagged, in plain English
const FLAG_REASONS = {
  slv:           'Sentences are very similar in length — more like an AI than a person.',
  stdv:          'Grammar complexity barely changes — AI writing is unusually consistent.',
  burstiness:    'The text uses unusually long, formal words throughout.',
  mattr:         'A narrow set of words is used repeatedly across the essay.',
  dcd:           'Words like "Furthermore", "Moreover", and "Additionally" are used too often.',
  sopd:          'Many sentences start the same way — a common AI pattern.',
  punct_entropy: 'Only commas and periods are used — no expressive punctuation.',
}

export default function ExplainPanel({ result }) {
  const suspicious = result.signals.filter(s => s.is_suspicious)
  const clean      = result.signals.filter(s => !s.is_suspicious)
  const total      = result.signals.length

  return (
    <div className="explain-panel" role="region" aria-label="Analysis explanation">
      <p className="section-label">What We Found</p>

      {suspicious.length > 0 ? (
        <>
          {/* ── Quick summary sentence ── */}
          <p className="explain-summary">
            {suspicious.length === 1
              ? `Out of ${total} checks, 1 raised a concern. That alone isn't enough to conclude AI writing — but it's worth a look.`
              : suspicious.length <= 3
              ? `Out of ${total} checks, ${suspicious.length} raised concerns. This suggests some AI-like patterns, but a human reviewer should look closer.`
              : `Out of ${total} checks, ${suspicious.length} raised concerns. This is a strong signal that parts of the essay may be AI-generated.`
            }
          </p>

          {/* ── Flagged signals ── */}
          <div className="explain-flags-heading">What raised concerns:</div>
          <ul className="explain-list">
            {suspicious.map((s, i) => (
              <li key={s.key} className="explain-list-item" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="explain-item-dot" aria-hidden="true" />
                <div>
                  <span className="explain-list-item-name">
                    {FRIENDLY_NAMES[s.key] || s.name}
                  </span>
                  <span className="explain-list-item-reason">
                    {FLAG_REASONS[s.key] || s.explanation}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {/* ── Clean signals ── */}
          {clean.length > 0 && (
            <div className="explain-clean">
              <span className="explain-clean-icon" aria-hidden="true">✓</span>
              <span>
                <strong>{clean.length} check{clean.length > 1 ? 's' : ''}</strong> looked human —{' '}
                {clean.map(s => FRIENDLY_NAMES[s.key] || s.name).join(', ')}.
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="explain-all-clean">
          <div className="explain-all-clean-icon" aria-hidden="true">✓</div>
          <div>
            <p className="explain-all-clean-heading">All {total} checks passed</p>
            <p className="explain-all-clean-sub">
              Every signal looks consistent with human writing. No patterns typical of AI generation were detected.
            </p>
          </div>
        </div>
      )}

      {/* ── Disclaimer note ── */}
      <div className="explain-note">
        <strong>Keep in mind:</strong> These are statistical patterns, not a final verdict.
        No single check is conclusive — a human reviewer should always make the final call.
      </div>
    </div>
  )
}
