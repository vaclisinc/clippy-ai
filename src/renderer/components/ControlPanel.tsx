import type { UserPreferences, CaptureMode } from '../../types'

interface ControlPanelProps {
  preferences: UserPreferences | null
  onChange: (partial: Partial<UserPreferences>) => void
}

const DEFAULTS: UserPreferences = {
  captureMode: 'sequence',
  pet: 'clippy'
}

const CAPTURE_MODE_OPTIONS: Array<{
  id: CaptureMode
  title: string
  description: string
}> = [
  {
    id: 'sequence',
    title: 'Cinematic Timeline (15s)',
    description:
      'Clippy records one frame per second and sends a 15-frame clip to the AI. Best for tracking fast-changing debugging sessions.'
  },
  {
    id: 'single',
    title: 'Quick Snapshot',
    description:
      'Captures a single screenshot each interval (based on .env SCREENSHOT_INTERVAL). Lower cost, good for calm workflows.'
  }
]

const PET_OPTIONS: Array<{
  id: string
  label: string
  emoji: string
  tagline: string
}> = [
  { id: 'clippy', label: 'Classic Bulb', emoji: '💡', tagline: 'Original minimal helper' },
  { id: 'cat', label: 'Curious Cat', emoji: '😺', tagline: 'Perches quietly until action calls' },
  { id: 'dog', label: 'Friendly Pup', emoji: '🐶', tagline: 'Tail-wagging debugging buddy' },
  { id: 'bunny', label: 'Bouncy Bunny', emoji: '🐰', tagline: 'Energetic learner for long reads' }
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
      <header>
        <h1>Clippy Control Center</h1>
        <p>Choose how Clippy watches your screen and which companion keeps you company.</p>
      </header>

      <section>
        <h2>Capture Style</h2>
        <div className="card-grid">
          {CAPTURE_MODE_OPTIONS.map(option => (
            <button
              key={option.id}
              type="button"
              className={`card ${current.captureMode === option.id ? 'is-active' : ''}`}
              onClick={() => handleCaptureModeChange(option.id)}
            >
              <div className="card-header">
                <div className="radio">
                  <span className="dot" />
                </div>
                <span>{option.title}</span>
              </div>
              <p>{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>Choose Your Pet</h2>
        <div className="pet-grid">
          {PET_OPTIONS.map(pet => (
            <button
              type="button"
              key={pet.id}
              className={`pet ${current.pet === pet.id ? 'is-active' : ''}`}
              onClick={() => handlePetChange(pet.id)}
            >
              <span className="pet-emoji">{pet.emoji}</span>
              <div className="pet-info">
                <strong>{pet.label}</strong>
                <span>{pet.tagline}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <footer>
        <p className="hint">
          Changes apply instantly. Clippy will restart screen capture when you switch modes.
        </p>
      </footer>

      <style>{`
        .control-panel {
          min-height: 100vh;
          padding: 32px 28px;
          background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
          color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }

        header p {
          margin: 8px 0 24px;
          color: rgba(15, 23, 42, 0.7);
        }

        section {
          margin-bottom: 32px;
        }

        section h2 {
          font-size: 18px;
          margin-bottom: 12px;
          font-weight: 600;
        }

        .card-grid {
          display: grid;
          gap: 12px;
        }

        .card {
          border-radius: 16px;
          border: 1px solid rgba(99, 102, 241, 0.12);
          background: rgba(255, 255, 255, 0.85);
          padding: 16px;
          text-align: left;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(99, 102, 241, 0.12);
        }

        .card.is-active {
          border-color: rgba(79, 70, 229, 0.6);
          box-shadow: 0 16px 28px rgba(79, 70, 229, 0.18);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .card p {
          margin: 0;
          color: rgba(15, 23, 42, 0.65);
          font-size: 14px;
          line-height: 1.5;
        }

        .radio {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          border: 2px solid rgba(79, 70, 229, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .card.is-active .radio {
          border-color: rgba(79, 70, 229, 1);
        }

        .card.is-active .radio .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(79, 70, 229, 1);
        }

        .pet-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
        }

        .pet {
          display: flex;
          align-items: center;
          gap: 12px;
          border-radius: 16px;
          border: 1px solid rgba(14, 165, 233, 0.18);
          background: rgba(255, 255, 255, 0.85);
          padding: 12px 14px;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }

        .pet:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(14, 165, 233, 0.15);
        }

        .pet.is-active {
          border-color: rgba(14, 165, 233, 0.55);
          box-shadow: 0 14px 26px rgba(14, 165, 233, 0.22);
        }

        .pet-emoji {
          font-size: 32px;
        }

        .pet-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }

        .pet-info strong {
          font-size: 15px;
        }

        .pet-info span {
          font-size: 12px;
          color: rgba(15, 23, 42, 0.6);
        }

        footer .hint {
          margin: 0;
          font-size: 12px;
          color: rgba(15, 23, 42, 0.55);
        }
      `}</style>
    </div>
  )
}
