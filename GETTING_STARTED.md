# 🚀 Getting Started - Clippy AI

## ✅ Project Initialized!

Your Clippy AI project has been initialized with the complete architecture for a 24-hour hackathon build.

## 📦 Next Steps

### 1. Install Dependencies (5 minutes)

```bash
npm install
```

This will install:
- Electron 28
- React 18 + TypeScript
- Framer Motion (animations)
- OpenAI SDK (for Open Router)
- better-sqlite3 (database)
- And all dev dependencies

### 2. Verify Environment (2 minutes)

Your `.env` file already has your Open Router API key configured:
```bash
cat .env
```

If you need to update it:
```bash
# Edit .env and replace the API key
nano .env
```

### 3. Test the Setup (5 minutes)

```bash
# Type check
npm run typecheck

# This will show some errors - that's normal!
# The errors are because dependencies aren't installed yet
```

After `npm install`:
```bash
# Run the app in development mode
npm run dev
```

### 4. Grant Permissions (First Run)

When you first run the app:
1. macOS will ask for **Screen Recording** permission
2. Go to: System Preferences → Security & Privacy → Privacy
3. Select "Screen Recording"
4. Check the box next to your terminal or Electron app
5. **Restart the app**

## 🎨 What You'll See

### On First Launch:
- A small Clippy window (200x200) in the bottom-right corner
- Clippy will be in "sleeping" state (😴)
- A larger window (400x600) for showing suggestions (initially hidden)

### After 15 Seconds:
- First screenshot captured
- Sent to GPT-4o mini for classification
- Console logs will show activity (if DEBUG=true)

### When Clippy Detects Something:
- Clippy changes to "suggesting" state (💡)
- Suggestion card slides out from Clippy
- You can dismiss or interact with suggestions

## 🛠️ Development Workflow

### Testing Debug Agent

1. Open your IDE (VSCode, etc.)
2. Create a file with an error (e.g., `const x: number = "string"`)
3. Run build/compile to see error
4. Wait 15-30 seconds
5. Clippy should detect the error and offer help

### Testing Learning Agent

1. Open a PDF or article (complex content)
2. Leave it open without interaction
3. Wait 3+ minutes (you can reduce `IDLE_THRESHOLD` in .env for faster testing)
4. Clippy should offer to explain the content

### Quick Test Mode

For faster iteration during development:

```bash
# In .env, reduce timings:
SCREENSHOT_INTERVAL=5        # 5 seconds instead of 15
IDLE_THRESHOLD=30            # 30 seconds instead of 180
DEBUG=true                   # See all logs
```

## 📁 Key Files to Edit

### Adding Features

**Agents** (`src/agents/`):
- `debug-agent.ts` - Modify error detection logic
- `learning-agent.ts` - Modify idle detection logic
- `router.ts` - Add new agent types

**UI** (`src/renderer/components/`):
- `Clippy.tsx` - Change animations/emoji
- `SuggestionCard.tsx` - Modify suggestion UI

**Main Process** (`src/main/`):
- `index.ts` - Window management, IPC handlers
- `screen-capture.ts` - Screenshot logic

### Configuration

- `.env` - Runtime configuration
- `electron.vite.config.ts` - Build configuration
- `tsconfig.json` - TypeScript settings

## 🐛 Troubleshooting

### "Cannot find module 'electron'"
```bash
npm install
```

### "Screen capture returns null"
Grant screen recording permission (see step 4 above)

### "API rate limit" or "401 error"
Check your OPENROUTER_API_KEY in `.env`

### "Clippy window doesn't show"
Check console for errors. May need to adjust window positioning:
```typescript
// In src/main/index.ts, adjust:
clippyWindow.setPosition(x, y)
```

### TypeScript errors in IDE
```bash
# Restart TypeScript server
# In VSCode: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

## 📊 Monitoring

### Console Logs

With `DEBUG=true` in `.env`, you'll see:
```
[ScreenCapture] Captured 1280x720 screenshot
[AgentRouter] Classification: error (confidence: 0.85)
[DebugAgent] Analyzing error...
[DebugAgent] Suggestion generated
```

### Database

Context is stored in SQLite:
```bash
# Location
~/Library/Application Support/clippy-ai/clippy.db

# View with
sqlite3 ~/Library/Application\ Support/clippy-ai/clippy.db
> SELECT * FROM events ORDER BY timestamp DESC LIMIT 10;
```

## 🎯 MVP Checklist (Focus)

For the 24-hour hackathon, focus on:

**Hour 0-4** (YOU ARE HERE):
- [x] Project initialized ✅
- [ ] Dependencies installed
- [ ] App runs and captures screen
- [ ] Permissions granted

**Hour 4-10**:
- [ ] Debug Agent detects errors
- [ ] Learning Agent detects idle
- [ ] Both agents generate suggestions

**Hour 10-16**:
- [ ] Clippy animations working
- [ ] Suggestion cards appear/dismiss
- [ ] UI polish

**Hour 16-22**:
- [ ] Demo scenario 1 prepared
- [ ] Demo scenario 2 prepared
- [ ] Recording backup video

**Hour 22-24**:
- [ ] Bug fixes
- [ ] Pitch deck
- [ ] Final testing

## 📚 Documentation

- **CLAUDE.md** - Full technical documentation
- **README.md** - Project overview and features
- **HACKATHON_CHECKLIST.md** - 24-hour timeline and tips

## 🎉 You're Ready!

Run this to start development:

```bash
npm install && npm run dev
```

Good luck building! 🐱✨

---

**Questions or issues?** Check CLAUDE.md for detailed architecture docs.
