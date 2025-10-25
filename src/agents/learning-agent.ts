import { BaseAgent } from './base-agent'
import type { AgentResponse, Context, Screenshot, Config } from '../types'

export class LearningAgent extends BaseAgent {
  private idleThreshold: number

  constructor(client: any, config: Config) {
    super(client)
    this.idleThreshold = config.idleThreshold * 1000 // Convert to ms
  }

  async analyze(
    screenshot: Screenshot,
    context: Context
  ): Promise<AgentResponse> {
    // Only assist if user has been idle long enough
    if (context.idleTime < this.idleThreshold) {
      return { shouldAssist: false }
    }

    const contextStr = this.createContext(context)

    const result = await this.client.analyze(
      screenshot.buffer,
      contextStr,
      'learning'
    )

    if (!result.shouldAssist || !result.suggestion) {
      return { shouldAssist: false }
    }

    return {
      shouldAssist: true,
      suggestion: {
        type: 'learning',
        title: '📚 Need help understanding this?',
        content: result.suggestion,
        confidence: 0.7,
        timestamp: Date.now()
        // Note: actions removed because functions can't be serialized over IPC
      },
      reasoning: result.reasoning
    }
  }
}
