import React, { useEffect, useRef } from 'react'
import ScannerDemo from './ScannerDemo'
import Logo from './Logo'

const HOW_IT_WORKS_STEPS = [
  {
    emoji: '📋',
    title: 'Paste Your Essay',
    desc: 'Drop any essay or AI-generated text—no account, no upload limits.',
  },
  {
    emoji: '⚙️',
    title: 'Run 7 Signals',
    desc: 'Our engine extracts Burstiness, Syntactic Depth, Lexical Diversity and 4 more—entirely on your machine.',
  },
  {
    emoji: '📊',
    title: 'Get Your Report',
    desc: 'See an explainable verdict with sentence-level heatmaps showing exactly what was flagged and why.',
  },
]

export default function LandingPage({ onGetStarted }) {
  const observerRef = useRef(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })

    const elements = document.querySelectorAll('.scroll-reveal')
    elements.forEach(el => observerRef.current.observe(el))

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [])

  return (
    <div className="landing-page screen-visible">

      {/* STICKY NAV */}
      <header className="app-header landing-header sticky" role="banner" style={{ justifyContent: 'flex-end' }}>
        <div className="header-nav">
          <a href="https://github.com/Kishan-Ravi" target="_blank" rel="noopener noreferrer" className="nav-link">GitHub</a>
          <button className="btn-primary nav-cta" onClick={onGetStarted}>
            GET STARTED
          </button>
        </div>
      </header>

      {/* SECTION 1: HERO */}
      <section className="landing-section hero-section" style={{ paddingTop: '2rem' }}>

        {/* Animated gradient noise background */}
        <div className="hero-gradient-bg" aria-hidden="true">
          <div className="hero-gradient-spot hero-gradient-spot-1" />
          <div className="hero-gradient-spot hero-gradient-spot-2" />
        </div>

        {/* CENTERED LOGO */}
        <div className="logo fade-in-up" style={{
          animationDelay: '0.05s',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '3rem',
          position: 'relative',
          zIndex: 1,
        }}>
          <Logo size={64} className="hero-logo-spacing" />
          <div>
            <div className="logo-text" style={{ fontSize: '2.6rem', fontWeight: '800', lineHeight: 1.1 }}>Nul!Drift</div>
            <div className="logo-tagline" style={{ fontSize: '1rem', fontWeight: '700', letterSpacing: '0.12em' }}>Read Between Tokens.</div>
          </div>
        </div>

        <div className="landing-main" style={{ paddingTop: 0, position: 'relative', zIndex: 1 }}>
          {/* Left Side: Hero Text */}
          <div className="landing-hero">
            <h1 className="hero-title fade-in-up" style={{ animationDelay: '0.1s' }}>
              Detect AI-generated text with <span className="text-gradient">statistical precision</span>.
            </h1>
            <p className="hero-description fade-in-up" style={{ animationDelay: '0.2s' }}>
              Nul!Drift is a 100% local, explainable feature-extraction system for AI-generated essay detection.
              We analyze 7 statistical signals like Burstiness, Syntactic Tree Depth Variance, and Lexical Diversity to provide
              in-depth, transparent reports—without relying on black-box LLM APIs.
            </p>
            <div className="hero-buttons fade-in-up" style={{ animationDelay: '0.4s' }}>
              <button className="btn-primary" onClick={onGetStarted}>
                GET STARTED
                <span className="btn-icon">→</span>
              </button>
              <button className="btn-secondary" onClick={() => {}}>
                DOWNLOAD CLI
              </button>
            </div>
          </div>

          {/* Right Side: Demo Scanner */}
          <div className="landing-demo-wrapper fade-in-up" style={{ animationDelay: '0.4s' }}>
            <ScannerDemo />
          </div>
        </div>

        <div className="scroll-indicator fade-in-up" style={{ animationDelay: '0.6s', position: 'relative', zIndex: 1 }}>
          <span className="scroll-text">Scroll to explore</span>
          <div className="scroll-arrow">↓</div>
        </div>
      </section>

      {/* SECTION 1.5: HOW IT WORKS */}
      <section className="how-it-works-section">
        {/* Label and title stagger in */}
        <p className="hiw-label scroll-reveal sr-d1">Simple by design</p>
        <h2 className="hiw-title scroll-reveal sr-d2">
          From paste to verdict in <span className="text-gradient">seconds</span>.
        </h2>

        {/* Each step slides up with individual stagger */}
        <div className="step-timeline">
          {HOW_IT_WORKS_STEPS.map((step, i) => (
            <React.Fragment key={i}>
              <div className={`step-item scroll-reveal sr-scale sr-d${i + 2}`}>
                <div className="step-number-wrap">
                  <span className="step-emoji">{step.emoji}</span>
                  <span className="step-num">{i + 1}</span>
                </div>
                <div className="step-title">{step.title}</div>
                <p className="step-desc">{step.desc}</p>
              </div>
              {i < HOW_IT_WORKS_STEPS.length - 1 && (
                <div className="step-connector" aria-hidden="true" />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* SECTION 2: 100% LOCAL & PRIVATE */}
      <section className="landing-section feature-section">
        <div className="feature-content">
          {/* Text slides in from the left */}
          <div className="feature-text scroll-reveal sr-left">
            <h2 className="feature-title">Absolute Privacy. <br/><span className="text-gradient">Zero API Calls.</span></h2>
            <p className="feature-description">
              Most AI detectors send your sensitive essays to third-party servers. Nul!Drift runs
              <strong> entirely on your local machine</strong>. Using lightweight spaCy models and mathematical
              heuristics, we extract advanced grammatical and vocabulary signals without ever touching the cloud.
            </p>
            <ul className="feature-list">
              <li className="scroll-reveal sr-d2"><span className="check">✓</span> Instant processing times</li>
              <li className="scroll-reveal sr-d3"><span className="check">✓</span> Complete data sovereignty</li>
              <li className="scroll-reveal sr-d4"><span className="check">✓</span> No subscription fees or API limits</li>
            </ul>
          </div>
          {/* Visual card slides in from the right */}
          <div className="feature-visual scroll-reveal sr-right sr-d2">
            <div className="premium-card abstract-local">
              <div className="lock-icon">🔒</div>
              <div className="pulse-ring"></div>
              <div className="pulse-ring"></div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: EXPLAINABLE AI */}
      <section className="landing-section feature-section alt-bg">
        <div className="feature-content reverse">
          {/* Text slides in from the right (reversed layout) */}
          <div className="feature-text scroll-reveal sr-right">
            <h2 className="feature-title">Stop guessing. <br/><span className="text-gradient">Start understanding.</span></h2>
            <p className="feature-description">
              "98% AI" means nothing if you don't know why. Nul!Drift breaks down the score using exactly 7 human-calibrated
              signals. Our interactive heatmap highlights the exact sentences that triggered high suspicion, allowing
              educators to provide actionable, concrete feedback.
            </p>
            <div className="stats-grid">
              <div className="stat-box scroll-reveal sr-d3">
                <span className="stat-val">7</span>
                <span className="stat-label">Statistical Signals</span>
              </div>
              <div className="stat-box scroll-reveal sr-d4">
                <span className="stat-val">3000+</span>
                <span className="stat-label">Calibrated Essays</span>
              </div>
            </div>
          </div>
          {/* Heatmap mockup slides in from the left */}
          <div className="feature-visual scroll-reveal sr-left sr-d2">
            <div className="heatmap-mockup-card">
              {/* Card header */}
              <div className="hm-header">
                <div className="hm-header-left">
                  <div className="hm-dot red" />
                  <div className="hm-dot yellow" />
                  <div className="hm-dot green" />
                  <span className="hm-filename">essay_analysis.txt</span>
                </div>
                <span className="hm-verdict-badge">⚠ High Suspicion</span>
              </div>

              {/* Sentence highlights — each staggered */}
              <div className="hm-body">
                <div className="hm-sentence hm-ai scroll-reveal sr-d2">
                  <span className="hm-text">
                    "The socioeconomic implications of widespread AI adoption are multifaceted and nuanced..."
                  </span>
                  <span className="hm-tag hm-tag-red">Low Burstiness</span>
                </div>

                <div className="hm-sentence hm-human scroll-reveal sr-d3">
                  <span className="hm-text">
                    "I remember the exact moment I realized something had changed..."
                  </span>
                  <span className="hm-tag hm-tag-blue">Human Pattern</span>
                </div>

                <div className="hm-sentence hm-ai scroll-reveal sr-d4">
                  <span className="hm-text">
                    "Furthermore, it is important to note that these developments necessitate careful consideration..."
                  </span>
                  <span className="hm-tag hm-tag-red">Transition Phrases</span>
                </div>

                <div className="hm-sentence hm-neutral scroll-reveal sr-d5">
                  <span className="hm-text">
                    "Despite these challenges, the path forward remains unclear to many observers."
                  </span>
                </div>
              </div>

              {/* Signal score pills */}
              <div className="hm-signals scroll-reveal sr-d5">
                <span className="hm-pill hm-pill-bad">Burstiness ↑</span>
                <span className="hm-pill hm-pill-bad">Syn. Depth ↑</span>
                <span className="hm-pill hm-pill-ok">Lex. Diversity ✓</span>
                <span className="hm-pill hm-pill-warn">Transitions !</span>
                <span className="hm-pill hm-pill-bad">TTR ↑</span>
                <span className="hm-pill hm-pill-ok">Punct. ✓</span>
              </div>

              {/* Score bar */}
              <div className="hm-score-row scroll-reveal sr-d6">
                <span className="hm-score-label">AI Suspicion Score</span>
                <div className="hm-score-track">
                  <div className="hm-score-fill" />
                </div>
                <span className="hm-score-pct">78%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: CTA */}
      <section className="landing-section cta-section">
        <div className="cta-box scroll-reveal sr-scale">
          <h2 className="cta-title">Ready to detect AI writing with confidence?</h2>
          <p className="cta-subtitle scroll-reveal sr-d2">Join the open-source movement for transparent AI detection.</p>
          <div className="scroll-reveal sr-d3">
            <button className="btn-primary large" onClick={onGetStarted}>
              ANALYZE AN ESSAY NOW
            </button>
          </div>
        </div>
      </section>

      <footer className="app-footer" role="contentinfo">
        Nul!Drift · Local AI-essay detection · 7 statistical signals · No LLM-as-judge ·{' '}
        <span style={{ color: 'var(--text-subtle)' }}>Every flag shows <em>why</em>.</span>
      </footer>

    </div>
  )
}
