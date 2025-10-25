import type { AgentResponse, Context, Screenshot } from '../types'
import { OpenRouterClient } from '../lib/openrouter'

export abstract class BaseAgent {
  protected client: OpenRouterClient

  constructor(client: OpenRouterClient) {
    this.client = client
  }

  abstract analyze(
    frames: Screenshot[],
    context: Context
  ): Promise<AgentResponse>

  protected createContext(context: Context): string {
    const recentFrameInfo =
      context.previousScreenshots && context.previousScreenshots.length > 0
        ? `
- Recent frames captured: ${context.previousScreenshots.length}
- First frame: ${new Date(
            context.previousScreenshots[0].timestamp
          ).toLocaleTimeString()}
- Last frame: ${new Date(
            context.previousScreenshots[
              context.previousScreenshots.length - 1
            ].timestamp
          ).toLocaleTimeString()}`
        : ''

    return `
Recent Activity:
- Idle time: ${Math.floor(context.idleTime / 1000)}s
- Current app: ${context.currentApp || 'unknown'}
- Recent events: ${context.recentEvents.length} events in history${recentFrameInfo}
    `.trim()
  }
}
