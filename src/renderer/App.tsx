import { useEffect, useState } from 'react'
import { useLocation } from './hooks/useLocation'
import Clippy from './components/Clippy'
import SuggestionCard from './components/SuggestionCard'
import type { Suggestion } from '../types'

function App() {
  const location = useLocation()
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)

  useEffect(() => {
    console.log('[App] Mounted, location:', location)

    if (!window.electronAPI) {
      console.error('[App] electronAPI not found! Preload may not be working.')
      return
    }

    console.log('[App] electronAPI found')

    // Listen for suggestions from main process
    window.electronAPI.onSuggestion((newSuggestion: Suggestion) => {
      console.log('[App] Received suggestion:', newSuggestion)
      setSuggestion(newSuggestion)
    })

    // Report user activity on any interaction
    const handleActivity = () => {
      window.electronAPI.reportActivity()
    }

    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
    }
  }, [location])

  const handleDismiss = async () => {
    await window.electronAPI.dismissSuggestion()
    setSuggestion(null)
  }

  // Route based on hash
  if (location === '/clippy') {
    console.log('[App] Rendering Clippy component')
    return (
      <Clippy
        suggestion={suggestion}
        onDismiss={handleDismiss}
      />
    )
  }

  console.log('[App] Rendering main app')
  console.log('[App] Current suggestion:', suggestion)

  return (
    <div className="app" style={{ padding: '20px', background: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333' }}>🐱 Clippy AI - Main Window</h1>
      <p style={{ color: '#666' }}>Location: {location}</p>
      <p style={{ color: '#666' }}>electronAPI: {window.electronAPI ? '✅ Available' : '❌ Not found'}</p>
      <p style={{ color: suggestion ? 'green' : 'orange', fontSize: '18px', fontWeight: 'bold' }}>
        Suggestion: {suggestion ? '✅ RECEIVED!' : '⏳ Waiting...'}
      </p>

      {suggestion ? (
        <div style={{ marginTop: '20px' }}>
          <div style={{ padding: '15px', background: '#e8f5e9', border: '2px solid #4caf50', borderRadius: '8px', marginBottom: '20px' }}>
            <h2 style={{ color: '#2e7d32', margin: '0 0 10px 0' }}>📬 Suggestion Received!</h2>
            <p><strong>Type:</strong> {suggestion.type}</p>
            <p><strong>Title:</strong> {suggestion.title}</p>
            <p><strong>Content preview:</strong> {suggestion.content?.substring(0, 100)}...</p>
            <button
              onClick={handleDismiss}
              style={{ padding: '10px 20px', marginTop: '10px', cursor: 'pointer', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Dismiss
            </button>
          </div>
          <SuggestionCard suggestion={suggestion} onDismiss={handleDismiss} />
        </div>
      ) : (
        <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', border: '2px solid #ffc107', borderRadius: '8px' }}>
          <p style={{ margin: 0 }}>⏳ Waiting for Clippy to detect something...</p>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>Screenshots are being taken every 15 seconds and analyzed by AI.</p>
        </div>
      )}
    </div>
  )
}

export default App
