import React, { useEffect, useState, useRef } from 'react'
import Logo from './Logo'

const SAMPLE_TEXT =
  'The socioeconomic implications of widespread artificial intelligence adoption are multifaceted. ' +
  'Furthermore, one must consider the nuanced interplay between technological innovation and societal norms. ' +
  'It is important to note that these developments necessitate careful consideration.'

const STEPS = [
  { label: 'Parsing essay text',           detail: 'Breaking your text into words and sentences',             dur: 900 },
  { label: 'Extracting vocabulary',        detail: 'Measuring how many different words are used',             dur: 900 },
  { label: 'Analysing sentence structure', detail: 'Computing grammar depth and variation across sentences',  dur: 900 },
  { label: 'Checking writing patterns',    detail: 'Scanning transition phrases, punctuation, and rhythm',    dur: 900 },
  { label: 'Comparing to human baselines', detail: 'Running 7 signals against a corpus of 3000+ real essays', dur: 1100 },
  { label: 'Generating report',            detail: 'Calculating your final AI suspicion score',               dur: 1100 },
]

// Phases: 'typing' | 'scanning' | 'done' | 'resetting'
export default function ScannerDemo() {
  const [demoPhase, setDemoPhase]   = useState('typing')  // 'typing' | 'scanning' | 'done'
  const [typedText, setTypedText]   = useState('')
  const [scanStep, setScanStep]     = useState(0)
  const timerRef                    = useRef(null)
  const charRef                     = useRef(0)

  // ── Phase: typing ──────────────────────────────────────────────
  useEffect(() => {
    if (demoPhase !== 'typing') return

    charRef.current = 0
    setTypedText('')

    const typeNext = () => {
      charRef.current += 1
      setTypedText(SAMPLE_TEXT.slice(0, charRef.current))

      if (charRef.current < SAMPLE_TEXT.length) {
        // vary speed a tiny bit for realism
        const delay = charRef.current % 7 === 0 ? 60 : 28
        timerRef.current = setTimeout(typeNext, delay)
      } else {
        // pause then move to scanning
        timerRef.current = setTimeout(() => {
          setScanStep(0)
          setDemoPhase('scanning')
        }, 700)
      }
    }

    timerRef.current = setTimeout(typeNext, 400)
    return () => clearTimeout(timerRef.current)
  }, [demoPhase])

  // ── Phase: scanning ─────────────────────────────────────────────
  useEffect(() => {
    if (demoPhase !== 'scanning') return

    if (scanStep >= STEPS.length) {
      timerRef.current = setTimeout(() => setDemoPhase('done'), 800)
      return
    }

    timerRef.current = setTimeout(() => {
      setScanStep(s => s + 1)
    }, STEPS[scanStep].dur)

    return () => clearTimeout(timerRef.current)
  }, [demoPhase, scanStep])

  // ── Phase: done — loop back ─────────────────────────────────────
  useEffect(() => {
    if (demoPhase !== 'done') return
    timerRef.current = setTimeout(() => {
      setDemoPhase('typing')
    }, 2800)
    return () => clearTimeout(timerRef.current)
  }, [demoPhase])

  const isTyping   = demoPhase === 'typing'
  const isScanning = demoPhase === 'scanning'
  const isDone     = demoPhase === 'done'

  const progress = isTyping ? 0 : Math.min(scanStep / STEPS.length, 1)

  return (
    <div className="scanner-demo" aria-hidden="true">
      <div className="scanner-card">

        {/* ── Typing phase: show textarea with live typing ── */}
        {isTyping && (
          <>
            <div className="scanner-header" style={{ marginBottom: '1rem' }}>
              <Logo size={24} className="scanner-logo-spacing" />
              <div>
                <div className="scanner-title">Paste Your Essay</div>
                <div className="scanner-sub">Start typing or paste below…</div>
              </div>
            </div>

            <div style={{
              flex: 1,
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--border-mid)',
              padding: '1rem 1.1rem',
              fontFamily: 'var(--font-body)',
              fontSize: '0.82rem',
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
              minHeight: '200px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {typedText}
              <span className="typing-cursor" />
            </div>

            <div style={{
              marginTop: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.7rem',
              color: 'var(--text-subtle)',
              fontFamily: 'var(--font-mono)',
            }}>
              <span>{typedText.split(/\s+/).filter(Boolean).length} words</span>
              <span>{typedText.length} chars</span>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <div style={{
                width: '100%',
                padding: '0.75rem',
                background: 'var(--gradient-accent)',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: 600,
                textAlign: 'center',
                opacity: 0.4,
                cursor: 'not-allowed',
              }}>
                ANALYZE ESSAY →
              </div>
            </div>
          </>
        )}

        {/* ── Scanning / Done phase: show step list ── */}
        {(isScanning || isDone) && (
          <>
            <div className="scanner-header">
              <Logo size={24} className="scanner-logo-spacing" />
              <div>
                <div className="scanner-title">
                  {isDone ? '✓ Analysis Complete' : 'Live Analysis Demo'}
                </div>
                <div className="scanner-sub">
                  {isDone
                    ? 'AI suspicion: High · 5 of 7 signals flagged'
                    : 'Analyzing sample essay · 7 statistical checks'
                  }
                </div>
              </div>
            </div>

            <ol className="scanner-steps">
              {STEPS.map((step, i) => {
                const isScanDone   = i < scanStep
                const isScanActive = i === scanStep && isScanning
                return (
                  <li
                    key={i}
                    className={`scanner-step ${isScanDone || isDone ? 'done' : isScanActive ? 'active' : 'pending'}`}
                  >
                    <div className="scanner-step-icon">
                      {(isScanDone || isDone)
                        ? '✓'
                        : isScanActive
                          ? <span className="scanner-step-spinner" />
                          : <span className="scanner-step-circle" />
                      }
                    </div>
                    <div className="scanner-step-body">
                      <span className="scanner-step-label">{step.label}</span>
                      <span className="scanner-step-detail" style={{
                        opacity: isScanActive ? 1 : 0,
                        transition: 'opacity 0.2s',
                        display: 'block'
                      }}>
                        {step.detail}
                      </span>
                    </div>
                    {isScanActive && (
                      <span className="scanner-pulse-dots">
                        <span /><span /><span />
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>

            <div className="scanner-progress-wrap">
              <div className="scanner-progress-track">
                <div className="scanner-progress-fill" style={{ width: `${progress * 100}%` }} />
              </div>
              <p className="scanner-progress-label">
                {isDone
                  ? 'All checks complete — preparing results…'
                  : `${scanStep} of ${STEPS.length} checks complete`
                }
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
