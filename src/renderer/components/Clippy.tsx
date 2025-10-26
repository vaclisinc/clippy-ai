import { useEffect, useState } from 'react'
import type { Suggestion } from '../../types'

type ClippyState = 'sleeping' | 'thinking' | 'suggesting'

interface ClippyProps {
  suggestion: Suggestion | null
  pet: string
  onDismiss: () => Promise<void> | void
}

const PET_EMOJI_MAP: Record<
  string,
  { sleeping: string; thinking: string; suggesting: string }
> = {
  clippy: { sleeping: '😴', thinking: '🤔', suggesting: '💡' },
  cat: { sleeping: '😴', thinking: '😼', suggesting: '😺' },
  dog: { sleeping: '😴', thinking: '🐕', suggesting: '🐶' },
  bunny: { sleeping: '😴', thinking: '🐰', suggesting: '🐇' }
}

export default function Clippy({
  suggestion,
  pet,
  onDismiss
}: ClippyProps) {
  const [state, setState] = useState<ClippyState>('sleeping')
  const [panelOpen, setPanelOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
    if (!window.electronAPI) return

    window.electronAPI.onClippyState((newState: string) => {
      setState((newState as ClippyState) || 'sleeping')
    })
  }, [])

  useEffect(() => {
    if (!window.electronAPI?.toggleSuggestionPanel) return
    window.electronAPI.toggleSuggestionPanel(panelOpen)
  }, [panelOpen])

  useEffect(() => {
    if (suggestion) {
      if (panelOpen) {
        setHasUnread(false)
      } else {
        setHasUnread(true)
      }
    } else {
      setPanelOpen(false)
      setHasUnread(false)
    }
  }, [suggestion, panelOpen])

  const getEmoji = () => {
    const palette = PET_EMOJI_MAP[pet] || PET_EMOJI_MAP.clippy
    switch (state) {
      case 'sleeping':
        return palette.sleeping
      case 'thinking':
        return palette.thinking
      case 'suggesting':
        return palette.suggesting
      default:
        return palette.suggesting
    }
  }

  const handleEmojiClick = () => {
    setPanelOpen(prev => !prev)
    setHasUnread(false)
  }

  const handleClosePanel = () => {
    setPanelOpen(false)
  }

  const handleDismissClick = async () => {
    await onDismiss()
    setPanelOpen(false)
    setHasUnread(false)
  }

  const handleOpenSettings = () => {
    window.electronAPI?.openControlPanel()
  }

  return (
    <div className={`clippy-shell ${panelOpen ? 'is-open' : ''}`}>
      <div className="emoji-section">
        <button
          className={`emoji-button clippy-${state}`}
          onClick={handleEmojiClick}
          title={suggestion ? 'Click to view suggestion' : 'No new suggestions'}
        >
          <span className="emoji">{getEmoji()}</span>
          {hasUnread && <span className="unread-dot" />}
        </button>

        <div className="status-label">
          {state === 'sleeping' && 'Sleeping'}
          {state === 'thinking' && 'Analyzing...'}
          {state === 'suggesting' && 'New suggestion'}
        </div>
        <button
          type="button"
          className="settings-btn"
          onClick={handleOpenSettings}
          title="Open control panel"
        >
          ⚙️
        </button>
      </div>

      {panelOpen && (
        <div className="suggestion-panel">
          <div className="panel-header">
            <div>
              <p className="panel-type">
                {suggestion ? suggestion.type.toUpperCase() : 'CLIPPY AI'}
              </p>
              <h3>{suggestion ? suggestion.title : 'No suggestions right now'}</h3>
            </div>

            <button className="panel-close" onClick={handleClosePanel}>
              ✕
            </button>
          </div>

          <div className="panel-body">
            {suggestion ? (
              <div
                className="markdown"
                dangerouslySetInnerHTML={{
                  __html: formatMarkdown(suggestion.content)
                }}
              />
            ) : (
              <p className="empty-message">No fresh tips right now—check back soon!</p>
            )}
          </div>

          <div className="panel-actions">
            {suggestion ? (
              <button className="primary" onClick={handleDismissClick}>
                Got it, thanks! 👍
              </button>
            ) : (
              <button className="secondary" onClick={handleClosePanel}>
                Okay
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        .clippy-shell {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          padding: 12px;
          box-sizing: border-box;
          background: transparent;
          color: #1f1f1f;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          -webkit-app-region: drag;
        }

        .clippy-shell.is-open {
          justify-content: flex-start;
          background: rgba(249, 249, 249, 0.92);
          backdrop-filter: blur(18px);
          border-radius: 20px;
          box-shadow: 0 12px 40px rgba(15, 23, 42, 0.25);
        }

        .emoji-section {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
        }

        .clippy-shell.is-open .emoji-section {
          width: 120px;
          flex-shrink: 0;
          border-right: 1px solid rgba(0, 0, 0, 0.08);
          padding-right: 12px;
          margin-right: 12px;
        }

        .emoji-button {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 96px;
          height: 96px;
          border-radius: 48px;
          border: none;
          background: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.2);
          -webkit-app-region: no-drag;
        }

        .emoji-button:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 38px rgba(15, 23, 42, 0.24);
        }

        .emoji {
          font-size: 64px;
          line-height: 1;
          user-select: none;
        }

        .clippy-sleeping {
          animation: breathing 2.6s ease-in-out infinite;
        }

        .clippy-thinking {
          animation: wiggle 0.8s ease-in-out infinite;
        }

        .clippy-suggesting {
          animation: pulse 0.6s ease-in-out 3;
        }

        .unread-dot {
          position: absolute;
          top: 14px;
          right: 16px;
          width: 14px;
          height: 14px;
          background: #ff4d4f;
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 0 8px rgba(255, 77, 79, 0.6);
        }

        .status-label {
          font-size: 12px;
          color: rgba(15, 23, 42, 0.65);
          font-weight: 500;
          -webkit-app-region: no-drag;
        }

        .settings-btn {
          border: none;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 999px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          cursor: pointer;
          margin-top: 4px;
          color: rgba(15, 23, 42, 0.7);
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.18);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          -webkit-app-region: no-drag;
        }

        .settings-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.25);
        }

        .suggestion-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          background: rgba(255, 255, 255, 0.92);
          border-radius: 16px;
          padding: 16px;
          box-sizing: border-box;
          box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.05);
          -webkit-app-region: no-drag;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }

        .panel-type {
          margin: 0 0 4px 0;
          font-size: 11px;
          letter-spacing: 0.08em;
          color: rgba(15, 23, 42, 0.45);
        }

        .panel-header h3 {
          margin: 0;
          font-size: 18px;
          color: rgba(15, 23, 42, 0.92);
        }

        .panel-close {
          border: none;
          background: transparent;
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          color: rgba(15, 23, 42, 0.45);
        }

        .panel-close:hover {
          color: rgba(15, 23, 42, 0.85);
        }

        .panel-body {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 16px;
          padding-right: 8px;
        }

        .markdown {
          font-size: 14px;
          line-height: 1.6;
          color: rgba(15, 23, 42, 0.8);
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .markdown code {
          background: rgba(15, 23, 42, 0.08);
          padding: 2px 6px;
          border-radius: 6px;
          font-family: 'Menlo', 'Monaco', monospace;
          font-size: 13px;
        }

        .markdown pre {
          background: rgba(15, 23, 42, 0.08);
          padding: 12px;
          border-radius: 10px;
          overflow-x: auto;
          white-space: pre;
        }

        .markdown p {
          margin: 0 0 12px 0;
        }

        .markdown a {
          color: #2563eb;
          text-decoration: none;
        }

        .markdown a:hover {
          text-decoration: underline;
        }

        .panel-body::-webkit-scrollbar {
          width: 6px;
        }

        .panel-body::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.6);
          border-radius: 999px;
        }

        .empty-message {
          margin: 0;
          font-size: 14px;
          color: rgba(15, 23, 42, 0.6);
        }

        .panel-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .primary,
        .secondary {
          border: none;
          border-radius: 10px;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .primary {
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          color: white;
          box-shadow: 0 10px 24px rgba(79, 70, 229, 0.35);
        }

        .primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(79, 70, 229, 0.45);
        }

        .secondary {
          background: rgba(148, 163, 184, 0.2);
          color: rgba(30, 41, 59, 0.9);
        }

        .secondary:hover {
          transform: translateY(-1px);
          background: rgba(148, 163, 184, 0.3);
        }

        @keyframes breathing {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.94); }
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  )
}

function formatMarkdown(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}
