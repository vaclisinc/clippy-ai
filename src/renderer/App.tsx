import { useEffect, useState } from 'react'
import { useLocation } from './hooks/useLocation'
import Clippy from './components/Clippy'
import ControlPanel from './components/ControlPanel'
import type { Suggestion, UserPreferences } from '../types'

function App() {
  const location = useLocation()
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)

  useEffect(() => {
    if (!window.electronAPI) {
      console.error('[App] electronAPI not found! Preload may not be working.')
      return
    }

    window.electronAPI.onSuggestion((newSuggestion: Suggestion) => {
      setSuggestion(newSuggestion)
    })

    window.electronAPI.onPreferences((next: UserPreferences) => {
      setPreferences(next)
    })

    window.electronAPI.getPreferences().then((prefs: UserPreferences) => {
      setPreferences(prefs)
    })

    const handleActivity = () => {
      window.electronAPI.reportActivity()
    }

    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
    }
  }, [])

  const handleDismiss = async () => {
    await window.electronAPI.dismissSuggestion()
    setSuggestion(null)
  }

  const handlePreferencesChange = async (partial: Partial<UserPreferences>) => {
    if (!window.electronAPI) return
    const next = await window.electronAPI.setPreferences(partial)
    setPreferences(next)
  }

  if (location === '/clippy') {
    return (
      <Clippy
        suggestion={suggestion}
        onDismiss={handleDismiss}
        pet={preferences?.pet ?? 'clippy'}
      />
    )
  }

  return (
    <ControlPanel
      preferences={preferences}
      onChange={handlePreferencesChange}
    />
  )
}

export default App
