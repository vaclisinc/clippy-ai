// Core types for Clippy AI

export type EventClassification =
  | 'error'
  | 'idle'
  | 'normal'
  | 'writing'
  | 'research'
  | 'code'

export type AgentType =
  | 'debug'
  | 'learning'
  | 'writing'
  | 'research'
  | 'security'

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
  classification?: EventClassification  // Add classification for screenshot storage
}

export interface ClassificationResult {
  classification: EventClassification
  confidence: number
  reasoning?: string
}

export interface Config {
  openRouterApiKey?: string
  anthropicApiKey?: string
  brightDataApiKey?: string
  codeRabbitApiKey?: string
  screenshotInterval: number
  idleThreshold: number
  debug: boolean
}

export interface ScreenshotMetadata {
  id: string
  filePath: string
  timestamp: number
  classification: EventClassification
  description?: string
  currentApp?: string
  width: number
  height: number
}

export interface VectorSearchResult {
  metadata: ScreenshotMetadata
  similarity: number
  screenshot?: Screenshot
}

export type CaptureMode = 'single' | 'sequence'

export interface UserPreferences {
  captureMode: CaptureMode
  pet: string
}
