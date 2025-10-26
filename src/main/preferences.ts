import { app } from 'electron'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import type { UserPreferences } from '../types'

const DEFAULT_PREFERENCES: UserPreferences = {
  captureMode: 'sequence',
  pet: 'clippy'
}

function getPreferencesPath(): string {
  const userData = app.getPath('userData')
  return join(userData, 'preferences.json')
}

function ensureParentDir(path: string) {
  const dir = dirname(path)
  try {
    mkdirSync(dir, { recursive: true })
  } catch (error) {
    // Directory may already exist
  }
}

function readPreferencesFile(): UserPreferences {
  const path = getPreferencesPath()
  try {
    const raw = readFileSync(path, 'utf-8')
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_PREFERENCES, ...parsed }
  } catch (error) {
    return DEFAULT_PREFERENCES
  }
}

function writePreferencesFile(preferences: UserPreferences) {
  const path = getPreferencesPath()
  ensureParentDir(path)
  try {
    writeFileSync(path, JSON.stringify(preferences, null, 2), 'utf-8')
  } catch (error) {
    console.error('[Preferences] Failed to persist preferences:', error)
  }
}

class PreferencesStore {
  private cache: UserPreferences

  constructor() {
    if (app.isReady()) {
      this.cache = readPreferencesFile()
    } else {
      this.cache = DEFAULT_PREFERENCES
      app.once('ready', () => {
        this.cache = readPreferencesFile()
      })
    }
  }

  get(): UserPreferences {
    return this.cache
  }

  set(partial: Partial<UserPreferences>): UserPreferences {
    this.cache = { ...this.cache, ...partial }
    if (app.isReady()) {
      writePreferencesFile(this.cache)
    } else {
      app.once('ready', () => writePreferencesFile(this.cache))
    }
    return this.cache
  }
}

export const preferencesStore = new PreferencesStore()
