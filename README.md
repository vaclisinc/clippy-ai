# 🐱 Clippy AI - Make Clippy Alive!

> An OS-level AI companion that actually helps (unlike the original Clippy)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Electron](https://img.shields.io/badge/Electron-28-blue)

## 🎯 What is Clippy AI?

Remember Microsoft's Clippy? That annoying paperclip that always showed up at the wrong time?

**Clippy AI** is what Clippy should have been - a truly intelligent, context-aware assistant that:
- 👀 Watches your entire screen (not just one app)
- 🧠 Understands what you're doing across all applications
- 💡 Only helps when you actually need it
- 🎨 Has a cute, non-intrusive UI

## ✨ Features

### 🔍 Debug Agent
Detects errors across your entire workflow:
- Catches errors in IDE, terminal, browser
- Provides specific solutions
- Suggests debugging steps
- Tracks issues across application boundaries

### 📚 Learning Agent
Helps when you're stuck reading/learning:
- Detects when you've been idle on complex content
- Offers ELI5 explanations
- Suggests additional resources
- Never interrupts active work

### 🎨 Cute UI
- Floating mascot with emoji expressions (😴/🤔/💡)
- Smooth animations (Framer Motion)
- Non-intrusive suggestion cards
- Always-on-top but easily dismissible

## 🚀 Quick Start

### Prerequisites
- macOS (Windows/Linux support coming soon)
- Node.js 18+
- [Open Router](https://openrouter.ai/) API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/clippy-ai.git
cd clippy-ai

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Add your OPENROUTER_API_KEY in .env

# Start development
npm run dev
```

### First Run

On macOS, you'll need to grant screen recording permission:
1. System Preferences → Security & Privacy → Privacy
2. Select "Screen Recording" from the left sidebar
3. Check the box next to "Clippy AI"
4. Restart the app

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│     Screen Capture (15s)            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Quick Classifier (GPT-4o mini)    │
│   → error / idle / normal           │
└─────────────────────────────────────┘
              ↓
┌──────────────┐    ┌─────────────────┐
│ Debug Agent  │    │ Learning Agent  │
│ (Claude 3.5) │    │ (Claude 3.5)    │
└──────────────┘    └─────────────────┘
              ↓
┌─────────────────────────────────────┐
│        Clippy UI                    │
│   (Floating suggestion card)        │
└─────────────────────────────────────┘
```

### Why Two AI Layers?

**Layer 1 (Classifier)**: Cheap + Fast
- GPT-4o mini ($0.15/1M tokens)
- Simple classification task
- Runs every 15 seconds

**Layer 2 (Analysis)**: Powerful + Selective
- Claude 3.5 Sonnet ($3/1M tokens)
- Deep reasoning and suggestions
- Only runs when needed (~20% of the time)

**Result**: High quality + Low cost

## 💰 Cost Estimate

Assuming 8 hours of active use per day:

- Screenshots: 1,920/day (8h × 4/min)
- Classifications: ~$0.03/day
- Deep analysis (20% trigger): ~$0.36/day

**Total: ~$0.40/day** or **~$12/month**

## 🎪 Demo Scenarios

### Scenario 1: Code Debugging
1. You write buggy TypeScript code
2. Terminal shows compilation errors
3. You switch to browser to Google the error
4. **Clippy detects the pattern** → Suggests solution immediately

### Scenario 2: Learning Assistant
1. You open a complex ML research paper
2. You've been on the "Attention Mechanism" page for 3+ minutes
3. **Clippy gently offers help** → Provides ELI5 explanation

## 🛠️ Development

```bash
# Run in development mode
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build
```

## 📁 Project Structure

```
src/
├── main/              # Electron main process
├── renderer/          # React UI
├── agents/            # AI agent logic
├── lib/               # Utilities (API, DB)
└── types/             # TypeScript definitions
```

See [AGENTS.md](./AGENTS.md) for detailed architecture documentation.

## 🔮 Future Ideas

- [ ] Local screening with Llama 3.2 Vision (privacy + cost)
- [ ] More specialized agents (productivity, code review)
- [ ] Learn user preferences over time
- [ ] Multi-monitor support
- [ ] Voice mode (TTS suggestions)
- [ ] Cross-platform support (Windows, Linux)

## 🤝 Contributing

This is a hackathon project! Contributions welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- Inspired by [Figma CEO Dylan Field's YC podcast](https://www.youtube.com/watch?v=example) about AI UX
- Built with [Anthropic Claude](https://anthropic.com/) and [Open Router](https://openrouter.ai/)
- Original Clippy by Microsoft (RIP 1997-2007)

## 📞 Contact

Built for hackathon by [Your Team Name]

---

**"What Clippy should have been."** 🐱✨
