# 🏆 Hackathon Checklist

## ⏰ 24-Hour Timeline

### Hours 0-4: Setup & Core Infrastructure ✅
- [x] Project structure initialized
- [x] Dependencies configured
- [x] TypeScript + Electron + React setup
- [ ] Run `npm install`
- [ ] Create `.env` with your API key
- [ ] Test basic Electron window opens

### Hours 4-10: Agent Implementation
- [ ] Test OpenRouter API connection
- [ ] Verify screen capture works (check permissions!)
- [ ] Test quick classifier with sample screenshots
- [ ] Implement Debug Agent
  - [ ] Error detection logic
  - [ ] Solution generation
- [ ] Implement Learning Agent
  - [ ] Idle detection
  - [ ] Content explanation
- [ ] Test both agents end-to-end

### Hours 10-16: UI/UX
- [ ] Clippy character animations
  - [ ] Sleeping state (😴)
  - [ ] Thinking state (🤔)
  - [ ] Suggesting state (💡)
- [ ] Suggestion card design
  - [ ] Markdown rendering
  - [ ] Action buttons
  - [ ] Dismiss functionality
- [ ] Window positioning and management
- [ ] Smooth transitions (Framer Motion)

### Hours 16-22: Demo Scenarios
- [ ] Prepare Demo 1: Code Debug
  - [ ] Create buggy code sample
  - [ ] Document expected flow
  - [ ] Test error detection
  - [ ] Verify suggestion quality
- [ ] Prepare Demo 2: Learning Assistant
  - [ ] Find complex PDF/article
  - [ ] Test idle detection timing
  - [ ] Verify explanation quality
- [ ] Record backup demo video (in case live fails)
- [ ] Practice pitch

### Hours 22-24: Polish & Pitch
- [ ] Bug fixes
  - [ ] Handle API errors gracefully
  - [ ] Fix any UI glitches
  - [ ] Test on fresh install
- [ ] Pitch deck
  - [ ] Problem slide
  - [ ] Solution slide
  - [ ] Architecture slide
  - [ ] Demo video
  - [ ] Vision/future slide
- [ ] Final testing

## 🎯 MVP Requirements (Must Have)

- [ ] Screen capture every 15 seconds
- [ ] Quick classification (GPT-4o mini)
- [ ] Two working agents:
  - [ ] Debug Agent (errors)
  - [ ] Learning Agent (idle)
- [ ] Clippy UI with animations
- [ ] Suggestion cards that appear/dismiss
- [ ] Two demo scenarios working

## 🎁 Nice to Have (If Time)

- [ ] Local LLM screening (Ollama + Llama 3.2)
- [ ] Web search integration for Debug Agent
- [ ] More emoji states for Clippy
- [ ] Sound effects
- [ ] Settings panel
- [ ] Keyboard shortcuts

## 🚨 Critical Paths (Don't Skip)

1. **API Setup** (Hour 0-1)
   ```bash
   # Get Open Router API key FIRST
   # https://openrouter.ai/
   echo "OPENROUTER_API_KEY=sk-or-..." > .env
   ```

2. **Permission Setup** (Hour 1-2)
   - Grant screen recording permission
   - Test capture works before building agents

3. **Agent Testing** (Hour 6-8)
   - Don't wait until end to test
   - Use real screenshots
   - Verify API responses

4. **Demo Prep** (Hour 18-20)
   - Have backup video
   - Test on clean machine if possible
   - Practice transitions

## 🎪 Demo Script

### Opening (30s)
"Remember Microsoft Clippy? It was annoying because it didn't understand context. We built what Clippy should have been - an AI that actually watches what you're doing and helps at the right time."

### Demo 1: Code Debug (3min)
1. Show VSCode with buggy code
2. Run build → errors in terminal
3. Switch to browser to search
4. **Clippy appears with solution**
5. Highlight: "Notice how it tracked across IDE, terminal, and browser"

### Demo 2: Learning (3min)
1. Open complex PDF
2. Explain: "I'm stuck on this section for 3 minutes..."
3. **Clippy offers explanation**
4. Highlight: "Non-intrusive, only when needed"

### Tech Deep Dive (2min)
- Show architecture diagram
- Explain two-layer AI strategy
- Mention cost optimization

### Vision (1min)
"This is more than a hackathon project. It's a step toward truly ambient AI - intelligence that lives in your OS, not just your apps."

## 📊 Judging Criteria Tips

### Technical Complexity ⭐⭐⭐⭐⭐
- Multi-agent architecture
- Vision AI integration
- Electron + IPC architecture
- Real-time screen analysis

### Innovation ⭐⭐⭐⭐⭐
- OS-level awareness (not IDE-locked)
- Proactive vs reactive AI
- Cross-application context
- New interaction paradigm

### Execution ⭐⭐⭐⭐
- Working demo (both scenarios)
- Polished UI
- Stable performance
- Clear pitch

### Practicality ⭐⭐⭐⭐
- Cost-effective ($12/month)
- Real pain point solution
- Privacy-conscious design
- Extensible architecture

## 🐛 Common Pitfalls

❌ **Don't**: Spend too much time on UI polish early
✅ **Do**: Get agents working first, pretty later

❌ **Don't**: Use real API calls in demo without backup
✅ **Do**: Record video backup in case of network issues

❌ **Don't**: Over-engineer the routing logic
✅ **Do**: Keep it simple - just 2 agents is enough

❌ **Don't**: Forget to test on fresh machine
✅ **Do**: Have teammate test install from scratch

## 💡 Pro Tips

1. **Test incrementally**: Don't wait to test everything at once
2. **Mock API calls**: Create fake responses for faster iteration
3. **Use demo mode**: Add flag to skip 3-minute idle wait
4. **Version control**: Commit working versions frequently
5. **Sleep**: Take power naps, don't code 24h straight

## 📝 Pre-Demo Checklist

- [ ] API keys loaded and working
- [ ] Permissions granted (screen recording)
- [ ] Both demo scenarios tested 3+ times
- [ ] Backup video recorded
- [ ] Pitch deck ready
- [ ] Laptop charged + charger nearby
- [ ] Network stable (or demo offline mode ready)
- [ ] Team knows who presents what
- [ ] Timer set (stay within time limit)

## 🎉 Stretch Goals (Post-Hackathon)

- [ ] Local model integration (privacy mode)
- [ ] More agent types (productivity, meetings)
- [ ] User preference learning
- [ ] Voice mode
- [ ] Mobile companion app
- [ ] Team/enterprise version

---

**Good luck! Make Clippy proud! 🐱✨**
