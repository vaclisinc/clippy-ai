import { useState, useEffect } from 'react'

type ClippyState = 'sleeping' | 'thinking' | 'suggesting'

export default function Clippy() {
  const [state, setState] = useState<ClippyState>('sleeping')

  useEffect(() => {
    console.log('[Clippy] Component mounted')

    if (window.electronAPI) {
      console.log('[Clippy] electronAPI found, setting up listener')
      window.electronAPI.onClippyState((newState: string) => {
        console.log('[Clippy] State changed to:', newState)
        setState(newState as ClippyState)
      })
    } else {
      console.error('[Clippy] electronAPI not found!')
    }
  }, [])

  const getEmoji = () => {
    switch (state) {
      case 'sleeping':
        return '😴'
      case 'thinking':
        return '🤔'
      case 'suggesting':
        return '💡'
      default:
        return '😊'
    }
  }

  return (
    <div className="clippy-container">
      <div
        className={`clippy clippy-${state}`}
        style={{
          fontSize: '120px',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        {getEmoji()}
      </div>

      <style>{`
        .clippy-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background: transparent;
        }

        .clippy {
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
        }

        .clippy-sleeping {
          animation: breathing 2s ease-in-out infinite;
        }

        .clippy-thinking {
          animation: wiggle 0.5s ease-in-out infinite;
        }

        .clippy-suggesting {
          animation: pulse 0.6s ease-in-out 3;
        }

        @keyframes breathing {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.95); }
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}
