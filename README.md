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

Clippy AI includes **four specialized AI agents** that monitor your workflow and assist when needed:

### 🐛 Debug Agent
Your personal debugging companion:
- Detects errors across IDE, terminal, and browser simultaneously
- Analyzes stack traces and error messages in real-time
- Provides specific solutions with code examples
- Suggests debugging steps and best practices
- Tracks issues across application boundaries

**Example**: TypeScript compilation error → Clippy explains the type mismatch and suggests the fix

### 📚 Learning Agent
Patient tutor for complex content:
- Detects when you've been idle on technical documentation, research papers, or tutorials
- Offers ELI5 (Explain Like I'm 5) explanations of complex concepts
- Breaks down jargon and technical terms
- Suggests additional learning resources
- Only activates during genuine idle periods (never interrupts active work)

**Example**: Stuck on "Attention Mechanisms" in a Transformer paper → Clippy provides a beginner-friendly explanation

### ✍️ Writing Coach Agent
Real-time writing assistance:
- Monitors writing activity in Google Docs, Notion, email clients, and text editors
- Detects grammar issues, unclear phrasing, and structural problems
- Suggests improvements for clarity and conciseness
- Provides tone adjustments (formal/casual/technical)
- Helps with writer's block by suggesting next steps

**Example**: Writing a technical blog post → Clippy suggests rephrasing complex sentences for better readability

### 🔍 Research Agent (with Bright Data integration)
Supercharge your research workflow:
- Detects active research patterns across tabs and applications
- Identifies key topics and concepts you're investigating
- Automatically fetches related academic papers, articles, and resources via Bright Data API
- Summarizes findings and highlights relevant sections
- Builds context across multiple research sessions

**Example**: Researching "Quantum Computing Error Correction" → Clippy surfaces recent papers and expert blog posts

### 🎨 Beautiful, Non-Intrusive UI
- Floating mascot with expressive emoji states (😴 idle / 🤔 thinking / 💡 suggesting / 🐛 debugging)
- Smooth animations and transitions
- Dismissible suggestion cards that don't block your work
- Always-on-top overlay with adjustable opacity
- One-click copy for code snippets and suggestions
- Toast notifications for quick feedback

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
│     Screen Capture (every 7s)       │
│      + OCR Text Extraction          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Quick Classifier (GPT-4o mini)    │
│   → error / idle / writing /        │
│     research / code / normal        │
└─────────────────────────────────────┘
              ↓
      Smart Agent Router
              ↓
┌──────────────┬─────────────┬──────────────┬───────────────┐
│ Debug Agent  │  Learning   │   Writing    │   Research    │
│ (Claude 3.5) │   Agent     │    Coach     │    Agent      │
│              │ (Claude 3.5)│ (Claude 3.5) │ (Claude 3.5)  │
│              │             │              │ + Bright Data │
└──────────────┴─────────────┴──────────────┴───────────────┘
              ↓
┌─────────────────────────────────────┐
│     Clippy UI (React + Electron)    │
│   - Floating mascot with emotions   │
│   - Suggestion cards & tooltips     │
│   - Toast notifications             │
│   - Copy-to-clipboard integration   │
└─────────────────────────────────────┘
```

### Why Two AI Layers?

**Layer 1 (Classifier)**: Cheap + Fast
- GPT-4o mini ($0.15/1M tokens)
- Simple 6-category classification (error/idle/writing/research/code/normal)
- Runs every 7 seconds
- ~95% accuracy in routing

**Layer 2 (Specialized Agents)**: Powerful + Selective
- Claude 3.5 Sonnet ($3/1M tokens) for deep reasoning
- Each agent has domain-specific prompts and logic
- Only runs when classifier detects assistance needed (~20-30% of the time)
- Research Agent can optionally integrate Bright Data API for web scraping

**Result**: High quality assistance + 20x cost reduction vs. naive approach

## 💰 Cost Estimate

Assuming 8 hours of active use per day:

- Screenshots: 1,920/day (8h × 4/min)
- Classifications: ~$0.03/day
- Deep analysis (20% trigger): ~$0.36/day

**Total: ~$0.40/day** or **~$12/month**

## 🎪 Demo Scenarios

### Scenario 1: Debug Agent in Action
1. You write buggy TypeScript code with a type error
2. Terminal shows compilation errors
3. You switch to browser to Google the error
4. **Clippy detects the cross-app error pattern** → Instantly suggests the type fix with code example

### Scenario 2: Learning Agent
1. You open a complex ML research paper on arXiv
2. You've been reading about "Attention Mechanisms" for 3+ minutes
3. **Clippy gently offers help** → Provides ELI5 explanation with diagrams

### Scenario 3: Writing Coach Agent
1. You're drafting a technical blog post in Notion
2. You write: "The algorithm utilizes sophisticated mechanisms to facilitate optimization"
3. **Clippy detects verbose writing** → Suggests: "The algorithm uses smart techniques to optimize performance"

### Scenario 4: Research Agent
1. You're researching "Quantum Error Correction" across 5 browser tabs
2. You're taking notes in Obsidian about different approaches
3. **Clippy identifies the research topic** → Automatically fetches latest papers via Bright Data and summarizes key findings

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
