import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import type { Event, Context } from '../types'

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

      CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
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

  close() {
    this.db.close()
  }
}
