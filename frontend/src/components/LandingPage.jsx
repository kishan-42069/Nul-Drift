import React, { useEffect, useRef } from 'react'
import ScannerDemo from './ScannerDemo'

export default function LandingPage({ onGetStarted }) {
  // Intersection Observer for scroll animations
  const observerRef = useRef(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })

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
        
        {/* CENTERED LOGO */}
        <div className="logo fade-in-up" style={{ 
          animationDelay: '0.05s', 
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '3rem' 
        }}>
          <div className="logo-icon" style={{ width: '56px', height: '56px', fontSize: '1.6rem', borderRadius: '12px' }} aria-hidden="true">⟁</div>
          <div>
            <div className="logo-text" style={{ fontSize: '2.6rem', fontWeight: '800', lineHeight: 1.1 }}>Nul!Drift</div>
            <div className="logo-tagline" style={{ fontSize: '1rem', fontWeight: '700', letterSpacing: '0.12em' }}>Read Between Tokens.</div>
          </div>
        </div>

        <div className="landing-main" style={{ paddingTop: 0 }}>
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
        
        <div className="scroll-indicator fade-in-up" style={{ animationDelay: '0.6s' }}>
          <span className="scroll-text">Scroll to explore</span>
          <div className="scroll-arrow">↓</div>
        </div>
      </section>

      {/* SECTION 2: 100% LOCAL & PRIVATE */}
      <section className="landing-section feature-section">
        <div className="feature-content scroll-reveal">
          <div className="feature-text">
            <h2 className="feature-title">Absolute Privacy. <br/><span className="text-gradient">Zero API Calls.</span></h2>
            <p className="feature-description">
              Most AI detectors send your sensitive essays to third-party servers. Nul!Drift runs 
              <strong> entirely on your local machine</strong>. Using lightweight spaCy models and mathematical 
              heuristics, we extract advanced grammatical and vocabulary signals without ever touching the cloud.
            </p>
            <ul className="feature-list">
              <li><span className="check">✓</span> Instant processing times</li>
              <li><span className="check">✓</span> Complete data sovereignty</li>
              <li><span className="check">✓</span> No subscription fees or API limits</li>
            </ul>
          </div>
          <div className="feature-visual">
            <div className="premium-card abstract-local">
              <div className="lock-icon">🔒</div>
              <div className="pulse-ring"></div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: EXPLAINABLE AI */}
      <section className="landing-section feature-section alt-bg">
        <div className="feature-content reverse scroll-reveal">
          <div className="feature-text">
            <h2 className="feature-title">Stop guessing. <br/><span className="text-gradient">Start understanding.</span></h2>
            <p className="feature-description">
              "98% AI" means nothing if you don't know why. Nul!Drift breaks down the score using exactly 7 human-calibrated 
              signals. Our interactive heatmap highlights the exact sentences that triggered high suspicion, allowing 
              educators to provide actionable, concrete feedback.
            </p>
            <div className="stats-grid">
              <div className="stat-box">
                <span className="stat-val">7</span>
                <span className="stat-label">Statistical Signals</span>
              </div>
              <div className="stat-box">
                <span className="stat-val">500+</span>
                <span className="stat-label">Calibrated Essays</span>
              </div>
            </div>
          </div>
          <div className="feature-visual">
            <div className="premium-card abstract-heatmap">
              <div className="heatmap-line ai"></div>
              <div className="heatmap-line human"></div>
              <div className="heatmap-line ai"></div>
              <div className="heatmap-line ai-light"></div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: CTA */}
      <section className="landing-section cta-section">
        <div className="cta-box scroll-reveal">
          <h2 className="cta-title">Ready to detect AI writing with confidence?</h2>
          <p className="cta-subtitle">Join the open-source movement for transparent AI detection.</p>
          <button className="btn-primary large" onClick={onGetStarted}>
            ANALYZE AN ESSAY NOW
          </button>
        </div>
      </section>

      <footer className="app-footer" role="contentinfo">
        Nul!Drift · Local AI-essay detection · 7 statistical signals · No LLM-as-judge ·{' '}
        <span style={{ color: 'var(--text-subtle)' }}>Every flag shows <em>why</em>.</span>
      </footer>

    </div>
  )
}
