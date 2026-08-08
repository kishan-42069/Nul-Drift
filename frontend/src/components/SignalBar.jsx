import React, { useState, useEffect } from 'react'

// ── Plain-English names for each technical signal key ──────────────────────
const FRIENDLY_NAMES = {
  slv:           'Sentence Length Variety',
  stdv:          'Sentence Complexity Mix',
  burstiness:    'Word Difficulty Level',
  mattr:         'Vocabulary Range',
  dcd:           'Use of Transition Phrases',
  sopd:          'How Sentences Start',
  punct_entropy: 'Punctuation Variety',
}

// ── What each signal actually means in plain English ───────────────────────
const FRIENDLY_DESC = {
  slv: {
    what: `Do sentences vary in length?`,
    human: `The sentences vary nicely in length — short bursts mixed with longer ones. That's a natural human writing rhythm.`,
    ai:    `The sentences are suspiciously similar in length. AI writing tends to be very even and consistent, unlike how humans naturally write.`,
  },
  stdv: {
    what: `Do sentences mix simple and complex grammar?`,
    human: `The grammar naturally mixes simple and complex structures. Humans tend to write casually at times and thoughtfully at others.`,
    ai:    `The grammar complexity is oddly uniform throughout — AI tends to write in a very consistent, "balanced" style without natural variation.`,
  },
  burstiness: {
    what: `Are the words simple and concrete, or long and abstract?`,
    human: `The vocabulary leans towards everyday words. Human writers — especially students — tend to use simpler, more direct language.`,
    ai:    `The vocabulary leans heavily towards long, formal words (like "aspirations", "endeavors", "engagement"). This is a common AI writing pattern.`,
  },
  mattr: {
    what: `Is a wide range of different words used?`,
    human: `A good variety of different words are used throughout the text — a natural sign of human creativity.`,
    ai:    `The same small set of "safe" words repeat throughout. AI tends to stick to a narrower vocabulary than a human writer would.`,
  },
  dcd: {
    what: `Are connector words used too much?`,
    human: `Transition words like "Furthermore" and "Moreover" are used sparingly. Teen writers rarely reach for these words.`,
    ai:    `The text leans heavily on formal connectors like "Furthermore", "Additionally", and "Moreover" — a strong AI writing pattern.`,
  },
  sopd: {
    what: `Do sentences start in different ways?`,
    human: `Sentences begin in a variety of ways — with different words, subjects, and structures. That's how humans naturally write.`,
    ai:    `Sentences tend to start the same way (e.g. always "The [something]" or always "I [verb]"). AI writing has very consistent sentence openings.`,
  },
  punct_entropy: {
    what: `Is punctuation used expressively?`,
    human: `The punctuation is expressive and varied — using dashes, semicolons, and different marks. Human writers naturally play with punctuation.`,
    ai:    `Almost only commas and periods are used. AI tends to play it very safe with punctuation, avoiding the dashes and colons a human would use.`,
  },
}

// ── Importance label ───────────────────────────────────────────────────────
const IMPORTANCE = {
  'Primary':    { label: 'High importance',    color: 'var(--text-primary)' },
  'Secondary':  { label: 'Medium importance',  color: 'var(--text-secondary)' },
  'Supporting': { label: 'Lower importance',   color: 'var(--text-muted)' },
}

function getBarClass(zScore) {
  if (zScore > 1.0) return 'suspicious'
  if (zScore > 0.5) return 'warn'
  return 'ok'
}

function getBarWidth(zScore) {
  const clamped = Math.max(-3, Math.min(3, zScore))
  return Math.round(((clamped + 3) / 6) * 100)
}

const RISK_LABEL = {
  ok:         { text: 'Looks Human',  bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.22)',  color: '#1A4F9E' },
  warn:       { text: 'Uncertain',    bg: 'var(--color-mod-bg)',   border: 'var(--color-mod-border)', color: 'var(--color-moderate)' },
  suspicious: { text: 'AI-Like',      bg: 'var(--color-high-bg)', border: 'var(--color-high-border)', color: 'var(--color-high)' },
}

const CIRCUMFERENCE = 2 * Math.PI * 22 // r=22
export default function SignalBar({ signal, isHighlighted, onHover, onHoverEnd }) {
  const [expanded, setExpanded] = useState(false)

  const barClass     = getBarClass(signal.z_score)
  const barWidth     = getBarWidth(signal.z_score) // 0 to 100
  const risk         = RISK_LABEL[barClass]
  const friendlyName = FRIENDLY_NAMES[signal.key] || signal.name
  const desc         = FRIENDLY_DESC[signal.key]
  const importance   = IMPORTANCE[signal.weight_label] || IMPORTANCE['Supporting']

  const offset = CIRCUMFERENCE - (barWidth / 100) * CIRCUMFERENCE

  useEffect(() => {
    if (expanded) {
      onHover && onHover(signal)
    } else {
      onHoverEnd && onHoverEnd()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded])

  return (
    <div
      className={`signal-item${signal.is_suspicious ? ' suspicious' : ''}${isHighlighted ? ' signal-item--highlighted' : ''}`}
      id={`signal-${signal.key}`}
    >
      <button
        className="signal-header signal-header-btn"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="signal-ring-wrap" style={{ position: 'relative', width: '50px', height: '50px' }}>
            <svg width="50" height="50" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="22" fill="none" stroke="var(--border-mid)" strokeWidth="4" />
              <circle
                cx="25" cy="25" r="22" fill="none"
                stroke={risk.color} strokeWidth="4"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 25 25)"
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: risk.color }}>
              {barWidth}%
            </div>
          </div>
          <div className="signal-header-left" style={{ textAlign: 'left' }}>
            <span className="signal-name">{friendlyName}</span>
            {desc && <span className="signal-what">{desc.what}</span>}
          </div>
        </div>

        <div className="signal-meta-group">
          <span
            className="signal-risk-badge"
            style={{ background: risk.bg, border: `1px solid ${risk.border}`, color: risk.color }}
          >
            {risk.text}
          </span>
          <span className="signal-chevron" aria-hidden="true">
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="signal-expanded" role="region">
          <p className="signal-explanation-full fade-in-fast">
            {signal.is_suspicious
              ? (desc ? desc.ai : signal.explanation)
              : (desc ? desc.human : signal.explanation)
            }
          </p>
          <p className="signal-importance-note fade-in-fast" style={{ animationDelay: '0.1s' }}>
            This check carries <strong>{importance.label}</strong> in the overall result.
          </p>
        </div>
      )}
    </div>
  )
}
