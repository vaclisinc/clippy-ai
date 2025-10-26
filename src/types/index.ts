// Core types for Clippy AI

export type EventClassification = 'error' | 'idle' | 'normal'

export type AgentType = 'debug' | 'learning'

export interface Screenshot {
  buffer: Buffer
  timestamp: number
  width: number
  height: number
}

export interface Context {
  previousScreenshots: Screenshot[]
  idleTime: number
  lastActivity: number
  currentApp?: string
  recentEvents: Event[]
}

export interface Event {
  type: EventClassification
  timestamp: number
  confidence: number
  metadata?: Record<string, any>
}

export interface Suggestion {
  type: AgentType
  title: string
  content: string
  confidence: number
  timestamp: number
  actions?: SuggestionAction[]
}

export interface SuggestionAction {
  label: string
  action: () => void | Promise<void>
}

export interface AgentResponse {
  shouldAssist: boolean
  suggestion?: Suggestion
  reasoning?: string
}

export interface ClassificationResult {
  classification: EventClassification
  confidence: number
  reasoning?: string
}

export interface Config {
  openRouterApiKey?: string
  anthropicApiKey?: string
  screenshotInterval: number
  idleThreshold: number
  debug: boolean
}

export type CaptureMode = 'single' | 'sequence'

export interface UserPreferences {
  captureMode: CaptureMode
  pet: string
}
