import type { Suggestion } from '../../types'

interface SuggestionCardProps {
  suggestion: Suggestion
  onDismiss: () => void
}

export default function SuggestionCard({
  suggestion,
  onDismiss
}: SuggestionCardProps) {
  return (
    <div className="suggestion-card">
      <div className="card-header">
        <h3>{suggestion.title}</h3>
        <button onClick={onDismiss} className="close-btn">
          ✕
        </button>
      </div>

      <div className="card-content">
        <div
          className="markdown"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(suggestion.content) }}
        />
      </div>

      <div className="card-actions">
        <button onClick={onDismiss} className="action-btn">
          Got it, thanks! 👍
        </button>
      </div>

      <style>{`
        .suggestion-card {
          position: fixed;
          bottom: 240px;
          right: 20px;
          width: 380px;
          max-height: 500px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          padding: 20px;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          animation: slideInUp 0.3s ease-out;
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .card-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #999;
          padding: 4px;
          line-height: 1;
        }

        .close-btn:hover {
          color: #333;
        }

        .card-content {
          max-height: 350px;
          overflow-y: auto;
          margin-bottom: 16px;
        }

        .markdown {
          font-size: 14px;
          line-height: 1.6;
          color: #555;
        }

        .markdown code {
          background: #f5f5f5;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 13px;
        }

        .markdown pre {
          background: #f5f5f5;
          padding: 12px;
          border-radius: 8px;
          overflow-x: auto;
        }

        .card-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 8px 16px;
          background: #007AFF;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .action-btn:hover {
          background: #0051D5;
        }
      `}</style>
    </div>
  )
}

// Simple markdown formatter (for MVP)
function formatMarkdown(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}
