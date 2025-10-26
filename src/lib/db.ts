import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import type { Event, Context, ScreenshotMetadata } from '../types'

export class ContextDB {
  private db: Database.Database

  constructor() {
    const dbPath = join(app.getPath('userData'), 'clippy.db')
    this.db = new Database(dbPath)
    this.initialize()
  }

  private initialize() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        confidence REAL NOT NULL,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS context (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS screenshots (
        id TEXT PRIMARY KEY,
        file_path TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        classification TEXT NOT NULL,
        description TEXT,
        current_app TEXT,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_screenshots_timestamp ON screenshots(timestamp);
      CREATE INDEX IF NOT EXISTS idx_screenshots_classification ON screenshots(classification);
    `)
  }

  addEvent(event: Event) {
    const stmt = this.db.prepare(`
      INSERT INTO events (type, timestamp, confidence, metadata)
      VALUES (?, ?, ?, ?)
    `)

    stmt.run(
      event.type,
      event.timestamp,
      event.confidence,
      JSON.stringify(event.metadata || {})
    )
  }

  getRecentEvents(limit = 10): Event[] {
    const stmt = this.db.prepare(`
      SELECT * FROM events
      ORDER BY timestamp DESC
      LIMIT ?
    `)

    const rows = stmt.all(limit) as any[]

    return rows.map((row) => ({
      type: row.type,
      timestamp: row.timestamp,
      confidence: row.confidence,
      metadata: JSON.parse(row.metadata)
    }))
  }

  setContextValue(key: string, value: any) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO context (key, value, updated_at)
      VALUES (?, ?, ?)
    `)

    stmt.run(key, JSON.stringify(value), Date.now())
  }

  getContextValue(key: string): any {
    const stmt = this.db.prepare(`
      SELECT value FROM context WHERE key = ?
    `)

    const row = stmt.get(key) as any
    return row ? JSON.parse(row.value) : null
  }

  getContext(): Context {
    const idleTime = this.getContextValue('idleTime') || 0
    const lastActivity = this.getContextValue('lastActivity') || Date.now()
    const currentApp = this.getContextValue('currentApp') || undefined
    const recentEvents = this.getRecentEvents()

    return {
      previousScreenshots: [], // Screenshots not persisted to DB
      idleTime,
      lastActivity,
      currentApp,
      recentEvents
    }
  }

  updateIdleTime(idleTime: number) {
    this.setContextValue('idleTime', idleTime)
  }

  updateLastActivity() {
    this.setContextValue('lastActivity', Date.now())
    this.setContextValue('idleTime', 0)
  }

  // Screenshot metadata operations
  addScreenshot(metadata: ScreenshotMetadata) {
    const stmt = this.db.prepare(`
      INSERT INTO screenshots (id, file_path, timestamp, classification, description, current_app, width, height)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      metadata.id,
      metadata.filePath,
      metadata.timestamp,
      metadata.classification,
      metadata.description || null,
      metadata.currentApp || null,
      metadata.width,
      metadata.height
    )
  }

  getScreenshot(id: string): ScreenshotMetadata | null {
    const stmt = this.db.prepare(`
      SELECT * FROM screenshots WHERE id = ?
    `)

    const row = stmt.get(id) as any

    if (!row) return null

    return {
      id: row.id,
      filePath: row.file_path,
      timestamp: row.timestamp,
      classification: row.classification,
      description: row.description,
      currentApp: row.current_app,
      width: row.width,
      height: row.height
    }
  }

  getRecentScreenshots(limit = 10): ScreenshotMetadata[] {
    const stmt = this.db.prepare(`
      SELECT * FROM screenshots
      ORDER BY timestamp DESC
      LIMIT ?
    `)

    const rows = stmt.all(limit) as any[]

    return rows.map((row) => ({
      id: row.id,
      filePath: row.file_path,
      timestamp: row.timestamp,
      classification: row.classification,
      description: row.description,
      currentApp: row.current_app,
      width: row.width,
      height: row.height
    }))
  }

  deleteOldScreenshots(olderThanTimestamp: number): number {
    const stmt = this.db.prepare(`
      DELETE FROM screenshots WHERE timestamp < ?
    `)

    const result = stmt.run(olderThanTimestamp)
    return result.changes
  }

  close() {
    this.db.close()
  }
}
