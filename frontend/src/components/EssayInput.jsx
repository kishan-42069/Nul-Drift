import React, { useState, useRef, useCallback } from 'react'

const API_URL = 'http://localhost:8000'

export default function EssayInput({ onResult, onError, onLoading }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [pasteFlash, setPasteFlash] = useState(false)
  const textareaRef = useRef(null)

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount = text.length

  const handlePaste = useCallback(() => {
    setPasteFlash(true)
    setTimeout(() => setPasteFlash(false), 600)
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (text.trim().length < 50) return
    setLoading(true)
    onLoading(true)
    onError(null)
    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Server error ${res.status}`)
      }
      const data = await res.json()
      onResult(data)
    } catch (e) {
      onError(e.message || 'Failed to connect to ProseGuard API. Is the backend running?')
    } finally {
      setLoading(false)
      onLoading(false)
    }
  }, [text, onResult, onError, onLoading])

  const canAnalyze = text.trim().length >= 50 && !loading

  return (
    <div className="glass-card input-panel">
      <p className="section-label">📝 Essay Input</p>
      <textarea
        ref={textareaRef}
        id="essay-textarea"
        className={`essay-textarea${pasteFlash ? ' paste-flash' : ''}`}
        placeholder="Paste a college admissions essay here (minimum 50 characters)…

ProseGuard analyzes 7 statistical signals to detect AI-generated prose — locally, with no external API calls."
        value={text}
        onChange={e => setText(e.target.value)}
        onPaste={handlePaste}
        spellCheck={false}
        aria-label="Essay text input"
      />
      <div className="text-stats">
        <div>Words: <span>{wordCount.toLocaleString()}</span></div>
        <div>Characters: <span>{charCount.toLocaleString()}</span></div>
        {text.trim().length > 0 && text.trim().length < 50 && (
          <div style={{ color: 'var(--color-moderate)' }}>
            Need {50 - text.trim().length} more characters
          </div>
        )}
      </div>
      <button
        id="analyze-btn"
        className="analyze-btn"
        onClick={handleAnalyze}
        disabled={!canAnalyze}
        aria-label="Analyze essay for AI generation signals"
      >
        {loading
          ? <><span className="btn-spinner" />Analyzing…</>
          : '🔍 Analyze Essay'
        }
      </button>
    </div>
  )
}
