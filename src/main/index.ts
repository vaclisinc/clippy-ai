import {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  screen
} from 'electron'
import { join } from 'path'
import { writeFileSync } from 'fs'
import { ScreenCapture } from './screen-capture'
import { ContextDB } from '../lib/db'
import { AgentRouter } from '../agents/router'
import { loadConfig } from './config'
let clippyWindow: BrowserWindow | null = null
let tray: Tray | null = null

let screenCapture: ScreenCapture
let db: ContextDB
let router: AgentRouter
let captureInterval: NodeJS.Timeout | null = null
let config: any

const WINDOW_MARGIN = 24
const COLLAPSED_SIZE = { width: 160, height: 160 }
const EXPANDED_SIZE = { width: 420, height: 520 }
const SUGGESTION_COOLDOWN_MS = 60 * 1000
const DISMISS_SUPPRESSION_MS = 5 * 60 * 1000

let lastSuggestionSignature: string | null = null
let lastSuggestionSentAt = 0
let activeSuggestionSignature: string | null = null
const suppressedSuggestions = new Map<string, number>()

function createSuggestionSignature(suggestion: {
  type: string
  title: string
  content: string
}): string {
  const title = suggestion.title ? suggestion.title.trim() : ''
  const content = suggestion.content ? suggestion.content.trim() : ''
  return `${suggestion.type}::${title}::${content}`
}

function pruneSuppressedSuggestions(now: number) {
  for (const [signature, timestamp] of suppressedSuggestions.entries()) {
    if (now - timestamp > DISMISS_SUPPRESSION_MS) {
      suppressedSuggestions.delete(signature)
    }
  }
}

function updateClippyState(state: 'sleeping' | 'thinking' | 'suggesting') {
  if (clippyWindow && !clippyWindow.isDestroyed()) {
    clippyWindow.webContents.send('clippy-state', state)
  }
}

function positionClippyWindow(window: BrowserWindow, size = COLLAPSED_SIZE) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const x = width - size.width - WINDOW_MARGIN
  const y = height - size.height - WINDOW_MARGIN

  window.setBounds(
    {
      x,
      y,
      width: size.width,
      height: size.height
    },
    false
  )
}

function createClippyWindow() {
  clippyWindow = new BrowserWindow({
    width: COLLAPSED_SIZE.width,
    height: COLLAPSED_SIZE.height,
    show: true,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  positionClippyWindow(clippyWindow, COLLAPSED_SIZE)

  if (process.env.NODE_ENV === 'development') {
    const devServerURL = process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173'
    const clippyURL = `${devServerURL}#/clippy`
    console.log(`[Clippy] Loading dev server: ${clippyURL}`)
    clippyWindow.loadURL(clippyURL)
  } else {
    clippyWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: 'clippy'
    })
  }
}

function createTray() {
  // Create a simple icon (in production, use a proper icon file)
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Clippy', click: () => clippyWindow?.show() },
    { label: 'Hide Clippy', click: () => clippyWindow?.hide() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])

  tray.setContextMenu(contextMenu)
  tray.setToolTip('Clippy AI')
}

async function startScreenMonitoring() {
  if (captureInterval) {
    clearInterval(captureInterval)
  }

  let captureCount = 0

  captureInterval = setInterval(async () => {
    captureCount++
    console.log(`\n[Monitor] 📸 Screenshot #${captureCount} at ${new Date().toLocaleTimeString()}`)

    const screenshot = await screenCapture.captureScreen()

    if (!screenshot) {
      console.log('[Monitor] ❌ Failed to capture screenshot')
      return
    }

    console.log(`[Monitor] ✅ Captured ${screenshot.width}x${screenshot.height} (${Math.round(screenshot.buffer.length / 1024)}KB)`)

    // Save screenshot for debugging
    const screenshotsDir = join(app.getPath('userData'), 'screenshots')
    const screenshotPath = join(screenshotsDir, `screenshot-${captureCount}.png`)
    try {
      // Create directory if it doesn't exist
      const { mkdirSync } = require('fs')
      try {
        mkdirSync(screenshotsDir, { recursive: true })
      } catch (e) {
        // Directory might already exist, ignore
      }

      writeFileSync(screenshotPath, screenshot.buffer)
      console.log(`[Monitor] 💾 Saved to: ${screenshotPath}`)
    } catch (error) {
      console.error('[Monitor] Failed to save screenshot:', error)
    }

    // Get context from database
    const context = db.getContext()
    console.log(`[Monitor] 📊 Context: idle=${Math.floor(context.idleTime / 1000)}s, events=${context.recentEvents.length}`)

    // Update idle time
    const now = Date.now()
    const timeSinceLastActivity = now - context.lastActivity
    db.updateIdleTime(timeSinceLastActivity)

    console.log('[Monitor] 🤖 Sending to AI for classification...')

    updateClippyState('thinking')

    // Route to appropriate agent
    const response = await router.route(screenshot, context)

    if (response.shouldAssist && response.suggestion) {
      console.log('[Monitor] 💡 Got suggestion!')
      console.log(`[Monitor] Type: ${response.suggestion.type}`)
      console.log(`[Monitor] Title: ${response.suggestion.title}`)
      console.log(`[Monitor] Preview: ${response.suggestion.content.substring(0, 100)}...`)

      // Prepare serializable suggestion (remove any functions)
      const serializableSuggestion = {
        type: response.suggestion.type,
        title: response.suggestion.title,
        content: response.suggestion.content,
        confidence: response.suggestion.confidence,
        timestamp: response.suggestion.timestamp
      }

      console.log('[Monitor] 📤 Sending suggestion to renderer...')

      try {
        const signature = createSuggestionSignature(serializableSuggestion)
        pruneSuppressedSuggestions(now)

        const suppressedUntil = suppressedSuggestions.get(signature)
        if (suppressedUntil && now - suppressedUntil < DISMISS_SUPPRESSION_MS) {
          console.log('[Monitor] 🔁 Suggestion suppressed (recently dismissed)')
          updateClippyState('sleeping')
        } else if (
          signature === lastSuggestionSignature &&
          now - lastSuggestionSentAt < SUGGESTION_COOLDOWN_MS
        ) {
          console.log('[Monitor] 🔁 Suggestion suppressed (cooldown active)')
          updateClippyState('sleeping')
        } else if (clippyWindow && !clippyWindow.isDestroyed()) {
          clippyWindow.show()
          clippyWindow.webContents.send('suggestion', serializableSuggestion)
          updateClippyState('suggesting')
          console.log('[Monitor] ✅ Suggestion sent to Clippy window')

          lastSuggestionSignature = signature
          lastSuggestionSentAt = now
          activeSuggestionSignature = signature
        } else {
          console.log('[Monitor] ❌ Clippy window not available')
        }
      } catch (error) {
        console.error('[Monitor] ❌ Error sending to renderer:', error)
      }

      // Log event
      db.addEvent({
        type: response.suggestion.type === 'debug' ? 'error' : 'idle',
        timestamp: now,
        confidence: response.suggestion.confidence
      })
    } else {
      console.log('[Monitor] ✋ No assistance needed (classified as normal)')
      activeSuggestionSignature = null

      updateClippyState('sleeping')
    }
  }, config.screenshotInterval * 1000)
}

app.whenReady().then(async () => {
  try {
    // Load configuration
    config = loadConfig()
    console.log('[Clippy AI] Configuration loaded successfully')
  } catch (error) {
    console.error('[Clippy AI] Failed to load configuration:', error)
    console.log('[Clippy AI] Make sure .env file exists with OPENROUTER_API_KEY')
    // Continue without AI features for now (just show UI)
    config = {
      screenshotInterval: 15,
      idleThreshold: 180,
      debug: true
    }
  }

  // Create windows first (so user sees something)
  createClippyWindow()
  createTray()

  // Initialize AI components only if we have API key
  if (config.openRouterApiKey || config.anthropicApiKey) {
    try {
      screenCapture = new ScreenCapture()
      db = new ContextDB()
      router = new AgentRouter(config)

      // Request screen capture permission
      const hasPermission = await screenCapture.requestPermission()

      if (!hasPermission) {
        console.warn('[Clippy AI] Screen capture permission denied')
        console.log('[Clippy AI] Please grant permission in System Preferences')
        return
      }

      // Start monitoring
      console.log('[Clippy AI] Starting screen monitoring...')
      await startScreenMonitoring()
    } catch (error) {
      console.error('[Clippy AI] Error initializing AI components:', error)
    }
  } else {
    console.warn('[Clippy AI] No API key found, running in UI-only mode')
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  if (captureInterval) {
    clearInterval(captureInterval)
  }
  db?.close()
})

// IPC Handlers
ipcMain.handle('dismiss-suggestion', () => {
  updateClippyState('sleeping')

  if (activeSuggestionSignature) {
    suppressedSuggestions.set(activeSuggestionSignature, Date.now())
    activeSuggestionSignature = null
  }
})

ipcMain.handle('user-activity', () => {
  db.updateLastActivity()
})

ipcMain.handle('toggle-suggestion-panel', (_event, open: boolean) => {
  if (!clippyWindow) return

  const targetSize = open ? EXPANDED_SIZE : COLLAPSED_SIZE
  positionClippyWindow(clippyWindow, targetSize)
})
