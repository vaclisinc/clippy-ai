import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Suggestion } from '../../types'

type ClippyState = 'sleeping' | 'thinking' | 'suggesting'

const OG_CLIPPY_SRC = new URL('../../../resources/clippy.png', import.meta.url).href
const DRAG_THRESHOLD = 3

const EMOJI_STATES: Record<ClippyState, string> = {
  sleeping: '😴',
  thinking: '🤔',
  suggesting: '💡'
}

interface ClippyProps {
  suggestion: Suggestion | null
  pet: string
  onDismiss: () => Promise<void> | void
}

export default function Clippy({ suggestion, pet, onDismiss }: ClippyProps) {
  const [state, setState] = useState<ClippyState>('sleeping')
  const [panelOpen, setPanelOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [showCopyToast, setShowCopyToast] = useState(false)
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null)
  const dragPointerIdRef = useRef<number | null>(null)
  const dragActiveRef = useRef(false)

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

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    dragOriginRef.current = { x: event.screenX, y: event.screenY }
    dragPointerIdRef.current = event.pointerId
    event.preventDefault()

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (dragPointerIdRef.current !== moveEvent.pointerId) return
      if (!dragOriginRef.current) return
      const deltaX = moveEvent.screenX - dragOriginRef.current.x
      const deltaY = moveEvent.screenY - dragOriginRef.current.y

      if (!dragActiveRef.current) {
        if (Math.abs(deltaX) >= DRAG_THRESHOLD || Math.abs(deltaY) >= DRAG_THRESHOLD) {
          dragActiveRef.current = true
        } else {
          return
        }
      }

      dragOriginRef.current = { x: moveEvent.screenX, y: moveEvent.screenY }
      window.electronAPI?.moveClippyWindow?.(deltaX, deltaY)
    }

    const handlePointerUp = (upEvent: PointerEvent) => {
      if (dragPointerIdRef.current !== upEvent.pointerId) return
      dragOriginRef.current = null
      dragActiveRef.current = false
      dragPointerIdRef.current = null
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  const handleAvatarClick = () => {
    setPanelOpen(prev => !prev)
    setHasUnread(false)
  }

  const handleDismissClick = async () => {
    await onDismiss()
    setPanelOpen(false)
    setHasUnread(false)
  }

  const handleCopyClick = async () => {
    if (!suggestion?.content) return
    try {
      await navigator.clipboard.writeText(suggestion.content)
      setShowCopyToast(true)
      setTimeout(() => setShowCopyToast(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleOpenSettings = () => {
    window.electronAPI?.openControlPanel()
  }

  const renderAvatar = () => {
    if (pet === 'clippy-classic') {
      return (
        <img
          src={OG_CLIPPY_SRC}
          alt="Clippy"
          className={`avatar-img state-${state}`}
          draggable={false}
        />
      )
    }

    return (
      <span className={`avatar-emoji state-${state}`}>
        {EMOJI_STATES[state]}
      </span>
    )
  }

  return (
    <div className={`clippy-shell ${panelOpen ? 'is-open' : ''}`}>
      <div className="avatar-column">
        <button
          type="button"
          className="avatar-wrapper"
          onClick={handleAvatarClick}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              handleAvatarClick()
            }
          }}
          title={suggestion ? 'Click to view suggestion' : 'No new suggestions'}
        >
          {renderAvatar()}
          {hasUnread && <span className="unread-dot" />}
        </button>

        <div className="status-label">
          {state === 'sleeping' && 'Sleeping'}
          {state === 'thinking' && 'Analyzing...'}
          {state === 'suggesting' && 'New suggestion'}
        </div>

        <div className="button-stack">
          <button
            type="button"
            className="drag-handle"
            onPointerDown={startDrag}
            title="Drag Clippy"
          >
            ⠿
          </button>
          <button
            type="button"
            className="settings-btn"
            onClick={handleOpenSettings}
            title="Open control panel"
          >
            ⚙️
          </button>
        </div>
      </div>

      {panelOpen && (
        <div className="suggestion-panel">
          <div className="panel-header">
            <h3>{suggestion ? suggestion.title : 'No suggestions'}</h3>
            <button className="panel-close" onClick={() => setPanelOpen(false)}>
              ✕
            </button>
          </div>

          <div className="panel-body">
            {suggestion ? (
              <div className="markdown">{suggestion.content}</div>
            ) : (
              <p className="empty-message">Check back soon</p>
            )}
          </div>

          <div className="panel-actions">
            {suggestion && (
              <>
                <button className="action-btn" onClick={handleCopyClick}>
                  Copy
                </button>
                <button className="action-btn primary" onClick={handleDismissClick}>
                  Dismiss
                </button>
              </>
            )}
          </div>

          {showCopyToast && (
            <div className="copy-toast">
              Copied
            </div>
          )}
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
        }

        .clippy-shell.is-open {
          justify-content: flex-start;
          gap: 18px;
          background: rgba(249, 249, 249, 0.92);
          backdrop-filter: blur(18px);
          border-radius: 20px;
          box-shadow: 0 12px 40px rgba(15, 23, 42, 0.25);
        }

        .avatar-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          position: relative;
        }

        .avatar-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.22);
          border: none;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .avatar-wrapper:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 32px rgba(79, 70, 229, 0.28);
        }

        .avatar-wrapper:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.35), 0 16px 32px rgba(79, 70, 229, 0.28);
        }

        .avatar-emoji {
          font-size: 66px;
          line-height: 1;
          user-select: none;
        }

        .avatar-img {
          width: 80px;
          height: 80px;
          object-fit: contain;
          user-select: none;
          pointer-events: none;
        }

        .avatar-img.state-thinking,
        .avatar-emoji.state-thinking {
          animation: wiggle 0.9s ease-in-out infinite;
        }

        .avatar-img.state-suggesting,
        .avatar-emoji.state-suggesting {
          animation: pulse 0.6s ease-in-out 3;
        }

        .unread-dot {
          position: absolute;
          top: 12px;
          left: 14px;
          width: 12px;
          height: 12px;
          background: #ef4444;
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.55);
        }

        .status-label {
          font-size: 12px;
          color: rgba(15, 23, 42, 0.65);
          font-weight: 500;
        }

        .button-stack {
          position: absolute;
          top: -6px;
          right: -8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .drag-handle,
        .settings-btn {
          border: none;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: rgba(15, 23, 42, 0.75);
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.18);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .drag-handle:hover,
        .settings-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.26);
        }

        .drag-handle {
          cursor: grab;
        }

        .drag-handle:active {
          cursor: grabbing;
        }

        .suggestion-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #ffffff;
          border-radius: 16px;
          padding: 20px;
          box-sizing: border-box;
          border: 1px solid #e5e5e5;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e5e5;
          margin-bottom: 16px;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
          color: #0a0a0a;
          letter-spacing: -0.01em;
        }

        .panel-close {
          border: none;
          background: transparent;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .panel-close:hover {
          color: #0a0a0a;
        }

        .panel-body {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 16px;
        }

        .markdown {
          font-size: 14px;
          line-height: 1.7;
          color: #0a0a0a;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .empty-message {
          color: #666;
          font-size: 14px;
          margin: 0;
        }

        .panel-body::-webkit-scrollbar {
          width: 6px;
        }

        .panel-body::-webkit-scrollbar-thumb {
          background: #e5e5e5;
          border-radius: 999px;
        }

        .panel-body::-webkit-scrollbar-thumb:hover {
          background: #d1d1d1;
        }

        .panel-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .action-btn {
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.15s ease;
          background: #ffffff;
          color: #0a0a0a;
        }

        .action-btn:hover {
          border-color: #0a0a0a;
        }

        .action-btn.primary {
          background: #0a0a0a;
          color: #ffffff;
          border-color: #0a0a0a;
        }

        .action-btn.primary:hover {
          background: #2a2a2a;
        }

        .copy-toast {
          position: absolute;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: #0a0a0a;
          color: #ffffff;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 400;
          animation: slideUp 0.2s ease;
          pointer-events: none;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
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
