import { BaseAgent } from './base-agent'
import type { AgentResponse, Context, Screenshot } from '../types'

export class DebugAgent extends BaseAgent {
  async analyze(
    screenshot: Screenshot,
    context: Context
  ): Promise<AgentResponse> {
    console.log('[DebugAgent] 🔍 Analyzing screenshot for errors...')
    const contextStr = this.createContext(context)

    const result = await this.client.analyze(
      screenshot.buffer,
      contextStr,
      'debug'
    )

    console.log('[DebugAgent] 📊 Claude response:', {
      shouldAssist: result.shouldAssist,
      hasSuggestion: !!result.suggestion,
      reasoning: result.reasoning?.substring(0, 100)
    })

    if (!result.shouldAssist || !result.suggestion) {
      console.log('[DebugAgent] ✋ Claude says no assistance needed')
      return { shouldAssist: false }
    }

    console.log('[DebugAgent] ✅ Generating suggestion...')

    return {
      shouldAssist: true,
      suggestion: {
        type: 'debug',
        title: '🔍 I noticed an error',
        content: result.suggestion,
        confidence: 0.8,
        timestamp: Date.now()
        // Note: actions removed because functions can't be serialized over IPC
        // Will implement actions in renderer side
      },
      reasoning: result.reasoning
    }
  }
}
