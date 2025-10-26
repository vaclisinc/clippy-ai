import type { UserPreferences, CaptureMode } from '../../types'

interface ControlPanelProps {
  preferences: UserPreferences | null
  onChange: (partial: Partial<UserPreferences>) => void
}

const DEFAULTS: UserPreferences = {
  captureMode: 'single',
  pet: 'clippy'
}

const CAPTURE_MODE_OPTIONS: Array<{
  id: CaptureMode
  title: string
  blurb: string
}> = [
  {
    id: 'sequence',
    title: 'Timeline (15s)',
    blurb: '1 fps clip • richer context'
  },
  {
    id: 'single',
    title: 'Quick Snapshot',
    blurb: 'Single frame • minimal cost'
  }
]

const PET_OPTIONS: Array<{
  id: string
  label: string
  emoji: string
  tagline: string
}> = [
  { id: 'clippy', label: 'Minimal Bulb', emoji: '💡', tagline: 'Subtle emoji companion' },
  { id: 'clippy-classic', label: 'OG Clippy', emoji: '📎', tagline: 'Classic paperclip with animations' }
]

export default function ControlPanel({
  preferences,
  onChange
}: ControlPanelProps) {
  const current = preferences ?? DEFAULTS

  const handleCaptureModeChange = (mode: CaptureMode) => {
    if (mode !== current.captureMode) {
      onChange({ captureMode: mode })
    }
  }

  const handlePetChange = (pet: string) => {
    if (pet !== current.pet) {
      onChange({ pet })
    }
  }

  return (
    <div className="control-panel">
      <header className="panel-header">
        <h1>Settings</h1>
      </header>

      <section className="section">
        <label className="label">Capture</label>
        <div className="option-grid">
          {CAPTURE_MODE_OPTIONS.map(option => (
            <button
              key={option.id}
              type="button"
              className={`option ${current.captureMode === option.id ? 'active' : ''}`}
              onClick={() => handleCaptureModeChange(option.id)}
            >
              <span className="option-title">{option.title}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <label className="label">Companion</label>
        <div className="option-grid">
          {PET_OPTIONS.map(pet => (
            <button
              type="button"
              key={pet.id}
              className={`option ${current.pet === pet.id ? 'active' : ''}`}
              onClick={() => handlePetChange(pet.id)}
            >
              <span className="pet-emoji">{pet.emoji}</span>
              <span className="option-title">{pet.label}</span>
            </button>
          ))}
        </div>
      </section>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .control-panel {
          height: 100vh;
          padding: 32px 28px;
          background: #ffffff;
          color: #0a0a0a;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .panel-header {
          padding-bottom: 20px;
          border-bottom: 1px solid #e5e5e5;
        }

        .panel-header h1 {
          margin: 0;
          font-size: 20px;
          font-weight: 500;
          color: #0a0a0a;
          letter-spacing: -0.01em;
        }

        .section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .label {
          font-size: 13px;
          font-weight: 500;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .option-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .option {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px 20px;
          border-radius: 8px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          color: #0a0a0a;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 14px;
          font-weight: 400;
        }

        .option:hover {
          border-color: #0a0a0a;
        }

        .option.active {
          border-color: #0a0a0a;
          background: #0a0a0a;
          color: #ffffff;
        }

        .option-title {
          font-size: 14px;
          font-weight: 400;
        }

        .pet-emoji {
          font-size: 18px;
          line-height: 1;
        }
      `}</style>
    </div>
  )
}
