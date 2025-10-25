# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, GitHub Copilot, GPT, etc.) when working with code in this repository.

## Project Overview

**Clippy AI** is an OS-level AI companion that proactively monitors your screen and provides contextual assistance. Unlike traditional AI assistants confined to IDEs, Clippy watches your entire workflow across all applications.

**Core Philosophy**: Ambient intelligence - be helpful, not annoying.

## Tech Stack

- **Desktop Framework**: Electron + TypeScript
- **UI**: React + Framer Motion
- **AI**:
  - Quick Classification: GPT-4o mini via Open Router (cheap, fast)
  - Deep Analysis: Claude 3.5 Sonnet via Open Router (powerful reasoning)
- **Storage**: SQLite (better-sqlite3) for context persistence
- **Screen Capture**: Electron desktopCapturer API

## Development Commands

```bash
# Install dependencies
npm install

# Development mode (hot reload)
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Lint code
npm run lint
```

## Architecture

### Multi-Agent System

```
Screen Capture (15s interval)
  ↓
Quick Classifier (GPT-4o mini)
  ├─ "error" → Debug Agent
  ├─ "idle" → Learning Agent
  └─ "normal" → No action
  ↓
Clippy UI (shows suggestion)
```

### Directory Structure

```
src/
├── main/              # Electron main process
│   ├── index.ts       # App entry, window management
│   ├── screen-capture.ts  # desktopCapturer wrapper
│   └── config.ts      # Environment config loader
├── preload/           # Bridge between main and renderer
│   └── index.ts       # IPC API exposure
├── renderer/          # React UI
│   ├── App.tsx        # Root component, suggestion handling
│   ├── components/
│   │   ├── Clippy.tsx           # Animated mascot (😴/🤔/💡)
│   │   └── SuggestionCard.tsx   # Floating suggestion UI
│   └── hooks/
│       └── useLocation.ts       # Simple hash-based routing
├── agents/            # AI agent logic
│   ├── router.ts      # Routes to appropriate agent
│   ├── base-agent.ts  # Abstract base class
│   ├── debug-agent.ts # Handles errors
│   └── learning-agent.ts  # Handles idle/learning
├── lib/
│   ├── openrouter.ts  # API client for GPT-4o mini + Claude
│   └── db.ts          # SQLite context storage
└── types/
    └── index.ts       # TypeScript type definitions
```

## Key Architectural Patterns

### 1. Two-Layer AI Strategy

**Layer 1: Quick Classifier (always runs)**
- Model: GPT-4o mini
- Cost: ~$0.15 per 1M tokens
- Purpose: Fast classification (error/idle/normal)
- Runs every 15 seconds

**Layer 2: Deep Analysis (only when needed)**
- Model: Claude 3.5 Sonnet
- Cost: ~$3 per 1M tokens
- Purpose: Generate helpful suggestions
- Only runs for error/idle events

### 2. Agent Pattern

All agents extend `BaseAgent`:

```typescript
abstract class BaseAgent {
  protected client: OpenRouterClient

  abstract analyze(
    screenshot: Screenshot,
    context: Context
  ): Promise<AgentResponse>
}
```

**Debug Agent**: Activates on error classification
- Detects: error messages, stack traces, red text
- Suggests: specific solutions, debugging steps

**Learning Agent**: Activates after 3+ minutes idle
- Detects: static content, reading complex material
- Suggests: ELI5 explanations, additional resources

### 3. Context Management

The `ContextDB` class maintains:
- Event history (classifications over time)
- Idle time tracking
- Last activity timestamp
- Current application (future feature)

This context is passed to agents for better decision-making.

## Configuration

Create a `.env` file (copy from `.env.example`):

```bash
# Required
OPENROUTER_API_KEY=sk-or-...

# Optional tuning
SCREENSHOT_INTERVAL=15    # seconds between captures
IDLE_THRESHOLD=180        # seconds before idle detection
DEBUG=false               # enable verbose logging
```

## macOS Screen Recording Permission

On first run, macOS will request screen recording permission:
1. System Preferences → Security & Privacy → Privacy → Screen Recording
2. Check the box next to "Clippy AI"
3. Restart the app

## Development Notes

### Adding a New Agent

1. Create `src/agents/new-agent.ts` extending `BaseAgent`
2. Implement the `analyze()` method
3. Add to `AgentRouter` in `src/agents/router.ts`
4. Update classifier to return new event type

### Modifying Clippy UI States

Edit `src/renderer/components/Clippy.tsx`:
- States: `sleeping | thinking | suggesting`
- Each state has a unique emoji and animation
- Framer Motion handles smooth transitions

### Adjusting Suggestion Card

Edit `src/renderer/components/SuggestionCard.tsx`:
- Supports Markdown formatting (basic subset)
- Actions are dynamic buttons
- Positioned relative to Clippy window

## Performance Considerations

1. **Screenshot Resolution**: Currently reduced to 50% to save API costs
   - Adjust in `src/main/screen-capture.ts` `thumbnailSize`

2. **Capture Interval**: Default 15 seconds
   - Faster = more responsive but higher cost
   - Slower = cheaper but may miss events

3. **API Costs** (assuming 100 captures/hour):
   - Classification: ~$0.01/hour
   - Deep analysis (20% trigger rate): ~$0.06/hour
   - Total: **~$0.07/hour** or **~$1.70/day**

## Debugging

Enable debug mode in `.env`:
```
DEBUG=true
```

Logs will show:
- Screenshot capture events
- Classification results
- Agent routing decisions
- API calls and responses

## Demo Scenarios

### Code Debug Scenario
1. Open VSCode, write buggy TypeScript
2. Run build, see error in terminal
3. Switch to browser to Google error
4. Clippy detects error pattern → Debug Agent → Shows solution

### Learning Assistant Scenario
1. Open ML research paper PDF
2. Stop at complex section (Multi-Head Attention)
3. Wait 3+ minutes
4. Clippy detects idle → Learning Agent → Offers explanation

## Future Enhancements (Out of MVP Scope)

- **Local Screener**: Llama 3.2 Vision via Ollama for privacy + cost savings
- **More Agents**: Productivity coach, code reviewer, meeting assistant
- **Active Application Tracking**: Use macOS accessibility APIs
- **User Preferences**: Learn what suggestions user finds helpful
- **Voice Mode**: TTS for suggestions
- **Multi-Monitor Support**: Track all screens

## Common Issues

**Issue**: "Cannot find module 'electron'"
**Fix**: Run `npm install` to install dependencies

**Issue**: Screen capture returns null
**Fix**: Grant screen recording permission in System Preferences

**Issue**: API rate limit errors
**Fix**: Increase `SCREENSHOT_INTERVAL` in `.env`

**Issue**: Clippy window not showing
**Fix**: Check Console logs, may need to adjust positioning for your screen resolution
