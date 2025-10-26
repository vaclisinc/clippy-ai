import { contextBridge, ipcRenderer } from 'electron'
import type { UserPreferences } from '../types'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  onSuggestion: (callback: (suggestion: any) => void) => {
    ipcRenderer.on('suggestion', (_event, suggestion) => callback(suggestion))
  },
  onClippyState: (callback: (state: string) => void) => {
    ipcRenderer.on('clippy-state', (_event, state) => callback(state))
  },
  onPreferences: (callback: (preferences: UserPreferences) => void) => {
    ipcRenderer.on('preferences', (_event, preferences) => callback(preferences))
  },
  getPreferences: (): Promise<UserPreferences> => ipcRenderer.invoke('get-preferences'),
  setPreferences: (preferences: Partial<UserPreferences>): Promise<UserPreferences> =>
    ipcRenderer.invoke('set-preferences', preferences),
  openControlPanel: () => ipcRenderer.invoke('open-control-panel'),
  dismissSuggestion: () => ipcRenderer.invoke('dismiss-suggestion'),
  reportActivity: () => ipcRenderer.invoke('user-activity'),
  toggleSuggestionPanel: (open: boolean) =>
    ipcRenderer.invoke('toggle-suggestion-panel', open)
})

// TypeScript declaration for the exposed API
declare global {
  interface Window {
    electronAPI: {
      onSuggestion: (callback: (suggestion: any) => void) => void
      onClippyState: (callback: (state: string) => void) => void
      onPreferences: (callback: (preferences: UserPreferences) => void) => void
      getPreferences: () => Promise<UserPreferences>
      setPreferences: (preferences: Partial<UserPreferences>) => Promise<UserPreferences>
      openControlPanel: () => Promise<void>
      dismissSuggestion: () => Promise<void>
      reportActivity: () => Promise<void>
      toggleSuggestionPanel: (open: boolean) => Promise<void>
    }
  }
}
