import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  onSuggestion: (callback: (suggestion: any) => void) => {
    ipcRenderer.on('suggestion', (_event, suggestion) => callback(suggestion))
  },
  onClippyState: (callback: (state: string) => void) => {
    ipcRenderer.on('clippy-state', (_event, state) => callback(state))
  },
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
      dismissSuggestion: () => Promise<void>
      reportActivity: () => Promise<void>
      toggleSuggestionPanel: (open: boolean) => Promise<void>
    }
  }
}
