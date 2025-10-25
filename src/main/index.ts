import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { writeFileSync } from 'fs'
import { ScreenCapture } from './screen-capture'
import { ContextDB } from '../lib/db'
import { AgentRouter } from '../agents/router'
import { loadConfig } from './config'
import type { Suggestion } from '../types'

let mainWindow: BrowserWindow | null = null
let clippyWindow: BrowserWindow | null = null
let tray: Tray | null = null

let screenCapture: ScreenCapture
let db: ContextDB
let router: AgentRouter
let captureInterval: NodeJS.Timeout | null = null
let config: any

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,  // 增大寬度方便開發
    height: 600,
    show: true,  // 開發時顯示主窗口
    frame: true, // 開發時顯示邊框方便移動
    transparent: false, // 開發時不透明
    alwaysOnTop: false,  // 開發時不置頂
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (process.env.NODE_ENV === 'development') {
    // Try loading test HTML first to verify window works
    const testPath = join(__dirname, '../../test.html')
    console.log(`[Main] Loading test file: ${testPath}`)

    mainWindow.loadFile(testPath).then(() => {
      console.log('[Main] ✅ Test file loaded! Window is working.')
      console.log('[Main] Now try loading dev server in 3 seconds...')

      setTimeout(() => {
        const devServerURL = 'http://localhost:5173'
        console.log(`[Main] Loading dev server: ${devServerURL}`)

        mainWindow?.loadURL(devServerURL).catch(err => {
          console.error('[Main] ❌ Failed to load dev server:', err)
          console.error('[Main] Dev server might not be running!')
        })
      }, 3000)
    })

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('[Main] ❌ Failed to load page:', errorCode, errorDescription)
    })

    mainWindow.webContents.on('did-finish-load', () => {
      console.log('[Main] ✅ Page loaded successfully')
    })

    mainWindow.webContents.openDevTools({ mode: 'detach' }) // 分離 DevTools
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createClippyWindow() {
  clippyWindow = new BrowserWindow({
    width: 300,  // 增大方便開發
    height: 300,
    show: true,
    frame: true,  // 開發時顯示邊框
    transparent: false,  // 開發時不透明
    alwaysOnTop: true,
    hasShadow: true,
    resizable: true,  // 開發時可調整大小
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Position in bottom-right corner
  const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize
  clippyWindow.setPosition(width - 350, height - 350)

  if (process.env.NODE_ENV === 'development') {
    clippyWindow.loadURL('http://localhost:5173#/clippy')
    clippyWindow.webContents.openDevTools({ mode: 'detach' }) // 分離 DevTools
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
        // Send suggestion to renderer
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('suggestion', serializableSuggestion)
          mainWindow.show() // Show main window when there's a suggestion
          console.log('[Monitor] ✅ Suggestion sent to main window')
        } else {
          console.log('[Monitor] ❌ Main window not available')
        }

        if (clippyWindow && !clippyWindow.isDestroyed()) {
          clippyWindow.webContents.send('clippy-state', 'suggesting')
          console.log('[Monitor] ✅ State sent to Clippy window')
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
      openRouterApiKey: '',
      screenshotInterval: 15,
      idleThreshold: 180,
      debug: true
    }
  }

  // Create windows first (so user sees something)
  createMainWindow()
  createClippyWindow()
  createTray()

  // Initialize AI components only if we have API key
  if (config.openRouterApiKey) {
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
  mainWindow?.hide()
  clippyWindow?.webContents.send('clippy-state', 'sleeping')
})

ipcMain.handle('user-activity', () => {
  db.updateLastActivity()
})
