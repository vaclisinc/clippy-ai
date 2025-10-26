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
import { preferencesStore } from './preferences'
import type { Screenshot, Config, UserPreferences } from '../types'
let clippyWindow: BrowserWindow | null = null
let settingsWindow: BrowserWindow | null = null
let tray: Tray | null = null

let screenCapture: ScreenCapture
let db: ContextDB
let router: AgentRouter
let captureInterval: NodeJS.Timeout | null = null
let config: Config
let preferences: UserPreferences

const WINDOW_MARGIN = 24
const COLLAPSED_SIZE = { width: 160, height: 160 }
const EXPANDED_SIZE = { width: 420, height: 520 }
const SUGGESTION_COOLDOWN_MS = 60 * 1000
const DISMISS_SUPPRESSION_MS = 5 * 60 * 1000
const FRAME_CAPTURE_INTERVAL_MS = 1000

let lastSuggestionSignature: string | null = null
let lastSuggestionSentAt = 0
let activeSuggestionSignature: string | null = null
const suppressedSuggestions = new Map<string, number>()
const frameBuffer: Screenshot[] = []
let frameBatchSize = 15
let frameBatchCount = 0
let frameCaptureIntervalMs = FRAME_CAPTURE_INTERVAL_MS
let clippyBounds: { x: number; y: number; width: number; height: number } | null = null
const VALID_PETS = new Set(['clippy', 'clippy-classic'])
let suggestionPanelOpen = false

function applyPreferences(next: UserPreferences, options: { restart?: boolean } = {}) {
  preferences = { ...next }

  if (!VALID_PETS.has(preferences.pet)) {
    preferences.pet = 'clippy'
  }

  if (preferences.captureMode === 'sequence') {
    frameCaptureIntervalMs = FRAME_CAPTURE_INTERVAL_MS
    frameBatchSize = Math.max(config.screenshotInterval, 1)
  } else {
    frameCaptureIntervalMs = Math.max(config.screenshotInterval, 1) * 1000
    frameBatchSize = 1
  }

  console.log(
    `[Clippy AI] Preferences applied: mode=${preferences.captureMode}, pet=${preferences.pet}, interval=${frameCaptureIntervalMs}ms, batch=${frameBatchSize}`
  )

  if (options.restart) {
    restartScreenMonitoring()
  }

  broadcastPreferences()
}

function broadcastPreferences() {
  if (clippyWindow && !clippyWindow.isDestroyed()) {
    clippyWindow.webContents.send('preferences', preferences)
  }

  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('preferences', preferences)
  }
}

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

function clampToScreen(
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number } {
  const { width: screenWidth, height: screenHeight } =
    screen.getPrimaryDisplay().workAreaSize

  const clampedX = Math.min(Math.max(0, x), screenWidth - width)
  const clampedY = Math.min(Math.max(0, y), screenHeight - height)

  return { x: clampedX, y: clampedY }
}

function setClippyBounds(
  size: { width: number; height: number },
  { snapToCorner = false }: { snapToCorner?: boolean } = {}
) {
  if (!clippyWindow || clippyWindow.isDestroyed()) return

  let x = clippyBounds?.x ?? 0
  let y = clippyBounds?.y ?? 0

  if (!clippyBounds || snapToCorner) {
    const { width: screenWidth, height: screenHeight } =
      screen.getPrimaryDisplay().workAreaSize
    x = screenWidth - size.width - WINDOW_MARGIN
    y = screenHeight - size.height - WINDOW_MARGIN
  }

  const clamped = clampToScreen(x, y, size.width, size.height)
  clippyBounds = {
    x: clamped.x,
    y: clamped.y,
    width: size.width,
    height: size.height
  }

  clippyWindow.setBounds(clippyBounds, false)
}

function moveClippyBy(deltaX: number, deltaY: number) {
  if (!clippyWindow || clippyWindow.isDestroyed()) return

  if (!clippyBounds) {
    clippyBounds = clippyWindow.getBounds()
  }

  const width = clippyBounds?.width ?? COLLAPSED_SIZE.width
  const height = clippyBounds?.height ?? COLLAPSED_SIZE.height
  const nextX = (clippyBounds?.x ?? 0) + deltaX
  const nextY = (clippyBounds?.y ?? 0) + deltaY
  const clamped = clampToScreen(nextX, nextY, width, height)
  clippyBounds = {
    x: Math.round(clamped.x),
    y: Math.round(clamped.y),
    width: Math.round(width),
    height: Math.round(height)
  }

  clippyWindow.setBounds(clippyBounds, false)
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

  setClippyBounds(COLLAPSED_SIZE, { snapToCorner: true })

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

  clippyWindow.webContents.on('did-finish-load', () => {
    broadcastPreferences()
  })

  clippyWindow.on('move', () => {
    if (!clippyWindow || clippyWindow.isDestroyed()) return
    const bounds = clippyWindow.getBounds()
    clippyBounds = bounds
  })
}

function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show()
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
    width: 440,
    height: 580,
    show: false,
    resizable: false,
    maximizable: false,
    title: 'Clippy Control Center',
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })

  settingsWindow.once('ready-to-show', () => {
    settingsWindow?.show()
  })

  if (process.env.NODE_ENV === 'development') {
    const devServerURL = process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173'
    const settingsURL = `${devServerURL}#/settings`
    console.log(`[Settings] Loading dev server: ${settingsURL}`)
    settingsWindow.loadURL(settingsURL)
  } else {
    settingsWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: 'settings'
    })
  }

  settingsWindow.webContents.on('did-finish-load', () => {
    broadcastPreferences()
  })
}

function createTray() {
  // Create a simple icon (in production, use a proper icon file)
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Control Panel', click: () => openSettingsWindow() },
    { label: 'Show Clippy', click: () => clippyWindow?.show() },
    { label: 'Hide Clippy', click: () => clippyWindow?.hide() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])

  tray.setContextMenu(contextMenu)
  tray.setToolTip('Clippy AI')
}

function stopScreenMonitoring() {
  if (captureInterval) {
    clearInterval(captureInterval)
    captureInterval = null
  }
}

async function restartScreenMonitoring() {
  stopScreenMonitoring()
  frameBuffer.length = 0
  frameBatchCount = 0
  try {
    await startScreenMonitoring()
  } catch (error) {
    console.error('[Clippy AI] Failed to restart monitoring:', error)
  }
}

async function startScreenMonitoring() {
  if (!screenCapture || !db || !router) {
    console.warn('[Clippy AI] Monitoring requested before initialization is complete')
    return
  }

  if (captureInterval) {
    clearInterval(captureInterval)
  }

  let frameCount = 0

  captureInterval = setInterval(async () => {
    // Skip capture if suggestion panel is open
    if (suggestionPanelOpen) {
      console.log('[Monitor] ⏸️  Skipping capture - suggestion panel is open')
      return
    }

    frameCount++
    console.log(`\n[Monitor] 📸 Capturing frame #${frameCount} at ${new Date().toLocaleTimeString()}`)

    const screenshot = await screenCapture.captureScreen()

    if (!screenshot) {
      console.log('[Monitor] ❌ Failed to capture screenshot')
      return
    }

    frameBuffer.push(screenshot)

    // Keep only the most recent frames needed for a batch
    if (frameBuffer.length > frameBatchSize) {
      frameBuffer.splice(0, frameBuffer.length - frameBatchSize)
    }

    console.log(`[Monitor] ✅ Frame captured (${screenshot.width}x${screenshot.height}, ${Math.round(screenshot.buffer.length / 1024)}KB). Buffer: ${frameBuffer.length}/${frameBatchSize}`)

    // Get context from database
    const context = db.getContext()
    console.log(`[Monitor] 📊 Context: idle=${Math.floor(context.idleTime / 1000)}s, events=${context.recentEvents.length}`)

    // Update idle time
    const now = Date.now()
    const timeSinceLastActivity = now - context.lastActivity
    db.updateIdleTime(timeSinceLastActivity)
    context.previousScreenshots = [...frameBuffer]

    if (frameBuffer.length < frameBatchSize) {
      console.log('[Monitor] ⏳ Waiting for more frames before classification...')
      return
    }

    // Prepare batch and reset buffer for next cycle
    const framesForAnalysis = [...frameBuffer]
    frameBuffer.length = 0
    frameBatchCount++

    console.log(`[Monitor] 🎞️ Processing frame batch #${frameBatchCount} (${framesForAnalysis.length} frames)`)

    // Save latest frame from batch for debugging
    const latestFrame = framesForAnalysis[framesForAnalysis.length - 1]
    const analysisTimestamp = latestFrame.timestamp || now
    const screenshotsDir = join(app.getPath('userData'), 'screenshots')
    const screenshotPath = join(screenshotsDir, `batch-${frameBatchCount}-latest.png`)
    try {
      const { mkdirSync } = require('fs')
      try {
        mkdirSync(screenshotsDir, { recursive: true })
      } catch (e) {
        // Directory might already exist, ignore
      }

      writeFileSync(screenshotPath, latestFrame.buffer)
      console.log(`[Monitor] 💾 Saved latest batch frame to: ${screenshotPath}`)
    } catch (error) {
      console.error('[Monitor] Failed to save batch frame:', error)
    }

    console.log('[Monitor] 🤖 Sending batch to AI for classification...')

    updateClippyState('thinking')

    context.previousScreenshots = framesForAnalysis

    // Route to appropriate agent
    const response = await router.route(framesForAnalysis, context)

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
        pruneSuppressedSuggestions(analysisTimestamp)

        const suppressedUntil = suppressedSuggestions.get(signature)
        if (suppressedUntil && analysisTimestamp - suppressedUntil < DISMISS_SUPPRESSION_MS) {
          console.log('[Monitor] 🔁 Suggestion suppressed (recently dismissed)')
          updateClippyState('sleeping')
        } else if (
          signature === lastSuggestionSignature &&
          analysisTimestamp - lastSuggestionSentAt < SUGGESTION_COOLDOWN_MS
        ) {
          console.log('[Monitor] 🔁 Suggestion suppressed (cooldown active)')
          updateClippyState('sleeping')
        } else if (clippyWindow && !clippyWindow.isDestroyed()) {
          clippyWindow.show()
          clippyWindow.webContents.send('suggestion', serializableSuggestion)
          updateClippyState('suggesting')
          console.log('[Monitor] ✅ Suggestion sent to Clippy window')

          lastSuggestionSignature = signature
          lastSuggestionSentAt = analysisTimestamp
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
        timestamp: response.suggestion.timestamp || analysisTimestamp,
        confidence: response.suggestion.confidence
      })
    } else {
      console.log('[Monitor] ✋ No assistance needed (classified as normal)')
      activeSuggestionSignature = null

      updateClippyState('sleeping')
    }
  }, frameCaptureIntervalMs)
}

app.whenReady().then(async () => {
  try {
    // Load configuration
    config = loadConfig()
    console.log('[Clippy AI] Configuration loaded successfully')
    frameBatchSize = Math.max(config.screenshotInterval, 1)
    console.log(
      `[Clippy AI] Frame batch size: ${frameBatchSize} (capturing 1 frame/sec)`
    )
    console.log(
      `[Clippy AI] Will analyze every ${frameBatchSize} frames (~${frameBatchSize} seconds).`
    )
  } catch (error) {
    console.error('[Clippy AI] Failed to load configuration:', error)
    console.log('[Clippy AI] Make sure .env file exists with OPENROUTER_API_KEY')
    // Continue without AI features for now (just show UI)
    config = {
      screenshotInterval: 15,
      idleThreshold: 180,
      debug: true
    }
    frameBatchSize = Math.max(config.screenshotInterval, 1)
    console.log(
      `[Clippy AI] Falling back to frame batch size ${frameBatchSize}`
    )
    console.log(
      `[Clippy AI] Will analyze every ${frameBatchSize} frames (~${frameBatchSize} seconds).`
    )
  }

  // Load and apply user preferences
  preferences = preferencesStore.get()
  applyPreferences(preferences)

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
  stopScreenMonitoring()
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

  suggestionPanelOpen = open
  console.log(`[Monitor] Suggestion panel ${open ? 'opened' : 'closed'} - ${open ? 'pausing' : 'resuming'} capture`)

  const targetSize = open ? EXPANDED_SIZE : COLLAPSED_SIZE
  setClippyBounds(targetSize)
})

ipcMain.handle('get-preferences', () => {
  return preferences
})

ipcMain.handle('set-preferences', (_event, partial: Partial<UserPreferences>) => {
  const next = preferencesStore.set(partial)
  applyPreferences(next, { restart: true })
  return next
})

ipcMain.handle('open-control-panel', () => {
  openSettingsWindow()
})

ipcMain.handle(
  'move-clippy-window',
  (_event, { deltaX, deltaY }: { deltaX: number; deltaY: number }) => {
    moveClippyBy(deltaX, deltaY)
  }
)
