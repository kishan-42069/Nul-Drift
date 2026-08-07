import React, { useMemo } from 'react'

// ── Discourse connectors (longest first for greedy matching) ───────────────
const DC_LIST = [
  'it is worth noting', 'it is important to note', 'as a result of',
  'as a result', 'on the other hand', 'in other words', 'in addition to',
  'in addition', 'in conclusion', 'in summary', 'in contrast', 'in particular',
  'to illustrate', 'to summarize', 'to conclude', 'for instance', 'for example',
  'that is to say', 'first and foremost', 'last but not least', 'as such',
  'furthermore', 'moreover', 'additionally', 'however', 'therefore',
  'consequently', 'nevertheless', 'nonetheless', 'subsequently', 'accordingly',
  'similarly', 'likewise', 'notably', 'importantly', 'specifically', 'indeed',
  'certainly', 'undoubtedly', 'evidently', 'clearly', 'obviously',
  'firstly', 'secondly', 'thirdly', 'finally', 'lastly', 'hence', 'thus',
]
const DC_REGEX = new RegExp(
  `\\b(${DC_LIST
    .sort((a, b) => b.length - a.length)
    .map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'))
    .join('|')})\\b`,
  'gi'
)

// ── Generic regex-based text splitter ─────────────────────────────────────
function splitByRegex(text, regex, cls) {
  const segs = []
  let last = 0
  let m
  regex.lastIndex = 0
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) segs.push({ text: text.slice(last, m.index), cls: '' })
    segs.push({ text: m[0], cls })
    last = m.index + m[0].length
  }
  if (last < text.length) segs.push({ text: text.slice(last), cls: '' })
  return segs
}

// ── Per-signal segmentation functions ─────────────────────────────────────

function segByDCD(text) {
  return splitByRegex(text, DC_REGEX, 'hl-high')
}

function segByBurstiness(text) {
  // Highlight words with 8+ characters (long / formal vocabulary)
  return splitByRegex(text, /\b[a-zA-Z]{8,}\b/g, 'hl-mod')
}

function segByPunct(text) {
  return splitByRegex(text, /[.!?;:—–\-()[\]{}"']/g, 'hl-info')
}

function segBySentenceLength(text, isAI) {
  // Color each sentence by word count, using red shades (AI) or blue shades (human)
  const prefix = isAI ? 'hl-sent-ai' : 'hl-sent-h'
  const sentRegex = /([^.!?]+[.!?]+\s*)/g
  const segs = []
  let last = 0
  let m
  while ((m = sentRegex.exec(text)) !== null) {
    if (m.index > last) segs.push({ text: text.slice(last, m.index), cls: '' })
    const words = m[0].trim().split(/\s+/).length
    const cls = words <= 10 ? `${prefix}-short` : words <= 20 ? `${prefix}-med` : `${prefix}-long`
    segs.push({ text: m[0], cls })
    last = m.index + m[0].length
  }
  if (last < text.length) segs.push({ text: text.slice(last), cls: '' })
  return segs.length ? segs : [{ text, cls: '' }]
}

function segBySentenceOpeners(text, cls) {
  // Highlight the first 2 words of each sentence
  const segs = []
  let remaining = text
  let offset = 0

  // Use sentence boundary detection
  const sentences = text.split(/(?<=[.!?])\s+/)
  let cursor = 0

  for (let i = 0; i < sentences.length; i++) {
    const sent = sentences[i]
    const m = sent.match(/^(\S+(?:\s+\S+)?)(\s[\s\S]*)?$/)
    if (m) {
      segs.push({ text: m[1], cls })
      if (m[2]) segs.push({ text: m[2], cls: '' })
    } else {
      segs.push({ text: sent, cls: '' })
    }
    if (i < sentences.length - 1) segs.push({ text: ' ', cls: '' })
  }
  return segs.length ? segs : [{ text, cls: '' }]
}

function segByRepeatedWords(text, cls) {
  // Find content words (4+ chars) that appear ≥2 times, skip stop words
  const STOP = new Set([
    'that', 'this', 'with', 'have', 'from', 'they', 'will', 'been', 'were',
    'their', 'what', 'there', 'when', 'your', 'each', 'which', 'would', 'make',
    'like', 'into', 'time', 'just', 'some', 'also', 'than', 'then', 'more',
    'very', 'about', 'could', 'other', 'after', 'first', 'well', 'even', 'back',
    'only', 'come', 'most', 'know', 'over', 'such', 'does', 'because', 'while',
    'where', 'those', 'through', 'being', 'still', 'should', 'these', 'every',
    'under', 'never', 'before', 'always', 'often', 'many', 'much', 'both',
    'here', 'when', 'them', 'then', 'been', 'want', 'need', 'feel', 'know',
  ])
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
  const freq = {}
  for (const w of words) freq[w] = (freq[w] || 0) + 1
  const repeated = new Set(
    Object.entries(freq)
      .filter(([w, c]) => c >= 2 && !STOP.has(w))
      .map(([w]) => w)
  )
  if (!repeated.size) return [{ text, cls: '' }]
  const regex = new RegExp(
    `\\b(${[...repeated]
      .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')})\\b`,
    'gi'
  )
  return splitByRegex(text, regex, cls)
}

// ── Main segmentation dispatcher ──────────────────────────────────────────
function getSegments(text, signal) {
  if (!signal || !text) return [{ text: text || '', cls: '' }]
  const isAI  = signal.is_suspicious
  const mark  = isAI ? 'hl-ai' : 'hl-human'

  switch (signal.key) {
    case 'dcd':           return splitByRegex(text, DC_REGEX, mark)
    case 'burstiness':    return splitByRegex(text, /\b[a-zA-Z]{8,}\b/g, mark)
    case 'slv':           return segBySentenceLength(text, isAI)
    case 'stdv':          return segBySentenceLength(text, isAI)
    case 'mattr':         return segByRepeatedWords(text, mark)
    case 'sopd':          return segBySentenceOpeners(text, mark)
    case 'punct_entropy': return splitByRegex(text, /[.!?;:—–\-()\[\]{}'"]/g, mark)
    default:              return [{ text, cls: '' }]
  }
}

// ── Display config per signal ──────────────────────────────────────────────
const SIGNAL_HINT = {
  dcd:           'Transition phrases are highlighted in red.',
  burstiness:    'Long, formal words (8+ letters) are highlighted in amber.',
  slv:           'Each sentence is colored by length — see the legend below.',
  stdv:          'Each sentence is colored by length — see the legend below.',
  mattr:         'Repeated key words are highlighted in amber.',
  sopd:          'The opening words of each sentence are highlighted in red.',
  punct_entropy: 'Every punctuation mark is highlighted in green.',
}

const FRIENDLY_NAMES = {
  slv:           'Sentence Length Variety',
  stdv:          'Sentence Complexity Mix',
  burstiness:    'Word Difficulty Level',
  mattr:         'Vocabulary Range',
  dcd:           'Use of Transition Phrases',
  sopd:          'How Sentences Start',
  punct_entropy: 'Punctuation Variety',
}

const SHOW_LENGTH_LEGEND = ['slv', 'stdv']

// ── Component ──────────────────────────────────────────────────────────────
export default function EssayPanel({ text, hoveredSignal }) {
  const segments = useMemo(
    () => getSegments(text, hoveredSignal),
    [text, hoveredSignal]
  )

  const isActive     = !!hoveredSignal
  const hint         = isActive ? SIGNAL_HINT[hoveredSignal.key] : null
  const friendlyName = isActive ? (FRIENDLY_NAMES[hoveredSignal.key] || hoveredSignal.name) : null
  const showLegend   = isActive && SHOW_LENGTH_LEGEND.includes(hoveredSignal.key)

  return (
    <div className={`essay-panel${isActive ? ' essay-panel--active' : ''}`} aria-label="Essay with highlights">

      {/* ── Header ── */}
      <div className="essay-panel-header">
        <p className="section-label">Your Essay</p>
        {isActive ? (
          <p className="essay-panel-hint essay-panel-hint--on">
            <span className="essay-panel-signal-name">{friendlyName}:</span>{' '}{hint}
          </p>
        ) : (
          <p className="essay-panel-hint">
            Click any check in Signal Breakdown to highlight that pattern in your essay.
          </p>
        )}
      </div>

      {/* ── Sentence-length legend ── */}
      {showLegend && (
        <div className="essay-legend" aria-label="Color legend">
          {hoveredSignal.is_suspicious ? (
            <>
              <span className="essay-legend-chip hl-sent-ai-short">Short (≤10 words)</span>
              <span className="essay-legend-chip hl-sent-ai-med">Medium (10–20)</span>
              <span className="essay-legend-chip hl-sent-ai-long">Long (20+ words)</span>
            </>
          ) : (
            <>
              <span className="essay-legend-chip hl-sent-h-short">Short (≤10 words)</span>
              <span className="essay-legend-chip hl-sent-h-med">Medium (10–20)</span>
              <span className="essay-legend-chip hl-sent-h-long">Long (20+ words)</span>
            </>
          )}
        </div>
      )}

      {/* ── Essay text with highlights ── */}
      <div className="essay-panel-text">
        {segments.map((seg, i) =>
          seg.cls
            ? <span key={i} className={`essay-mark ${seg.cls}`}>{seg.text}</span>
            : <span key={i}>{seg.text}</span>
        )}
      </div>

    </div>
  )
}
