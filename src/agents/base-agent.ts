import type { AgentResponse, Context, Screenshot } from '../types'
import { OpenRouterClient } from '../lib/openrouter'

export abstract class BaseAgent {
  protected client: OpenRouterClient

  constructor(client: OpenRouterClient) {
    this.client = client
  }

  abstract analyze(
    screenshot: Screenshot,
    context: Context
  ): Promise<AgentResponse>

  protected createContext(context: Context): string {
    return `
Recent Activity:
- Idle time: ${Math.floor(context.idleTime / 1000)}s
- Current app: ${context.currentApp || 'unknown'}
- Recent events: ${context.recentEvents.length} events in history
    `.trim()
  }
}
