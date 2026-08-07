import React, { useState, useRef, useCallback } from 'react'

const API_URL = 'http://localhost:8000'

export default function EssayInput({ onScanStart, onResult, onError }) {
  const [text, setText]             = useState('')
  const [pasteFlash, setPasteFlash] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount = text.length
  const need      = Math.max(0, 50 - text.trim().length)

  const handlePaste = useCallback(() => {
    setPasteFlash(true)
    setTimeout(() => setPasteFlash(false), 600)
  }, [])

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    onScanStart(`Extracting and analyzing ${file.name}...`);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/analyze/file`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }
      
      const data = await res.json();
      onResult(data);
    } catch (err) {
      onError(err.message || 'Failed to upload and analyze document.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  }, [onScanStart, onResult, onError]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = useCallback(async () => {
    const cleanText = text.trim()
    if (cleanText.length < 50) return

    // Switch to scanner screen immediately — API call runs concurrently
    onScanStart(cleanText)

    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text: cleanText }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Server error ${res.status}`)
      }
      const data = await res.json()
      onResult(data)
    } catch (e) {
      onError(e.message || 'Failed to connect to Nul!Drift API. Is the backend running?')
    }
  }, [text, onScanStart, onResult, onError])

  const canAnalyze = text.trim().length >= 50

  return (
    <div className="input-panel">
      <div>
        <h1 className="input-title">Analyze Essay</h1>
        <p className="input-subtitle">
          Paste a college admissions essay to check for AI-generated prose.
        </p>
      </div>

      <textarea
        ref={textareaRef}
        id="essay-textarea"
        className={`essay-textarea${pasteFlash ? ' paste-flash' : ''}`}
        placeholder={
          `Paste a college admissions essay here (minimum 50 characters)…\n\nNul!Drift analyzes 7 statistical signals to detect AI-generated prose — locally, with no external API calls.`
        }
        value={text}
        onChange={e => setText(e.target.value)}
        onPaste={handlePaste}
        spellCheck={false}
        aria-label="Essay text input"
      />

      {/* Stats row */}
      <div className="text-stats">
        <div>Words: <span>{wordCount.toLocaleString()}</span></div>
        <div>Characters: <span>{charCount.toLocaleString()}</span></div>
        {text.trim().length > 0 && need > 0 && (
          <div style={{ color: 'var(--color-moderate)' }}>
            {need} more characters needed
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button
          id="analyze-btn"
          className="analyze-btn"
          onClick={handleAnalyze}
          disabled={!canAnalyze || isUploading}
          aria-label="Analyze essay for AI generation signals"
          style={{ flex: 1 }}
        >
          Analyze Text
        </button>
        <button
          className="upload-btn analyze-btn"
          onClick={handleUploadClick}
          disabled={isUploading}
          style={{ flex: 1, backgroundColor: 'var(--accent)', color: '#FFFFFF', border: '1px solid var(--border-fine)' }}
        >
          {isUploading ? 'Processing...' : 'Upload PDF / Word'}
        </button>
      </div>

      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.doc,.docx,.txt"
        style={{ display: 'none' }}
      />
    </div>
  )
}
