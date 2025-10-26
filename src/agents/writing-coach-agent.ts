import { BaseAgent } from './base-agent'
import type { AgentResponse, Context, Screenshot } from '../types'

export class WritingCoachAgent extends BaseAgent {
  async analyze(
    frames: Screenshot[],
    context: Context
  ): Promise<AgentResponse> {
    console.log('[WritingCoachAgent] 📝 Analyzing writing activity...')
    const contextStr = this.createContext(context)
    const latestFrame = frames[frames.length - 1]

    // Use AI to analyze the writing and provide suggestions
    const result = await this.client.analyze(
      frames,
      contextStr,
      'writing' as any  // We'll extend this type later
    )

    console.log('[WritingCoachAgent] 📊 AI response:', {
      shouldAssist: result.shouldAssist,
      hasSuggestion: !!result.suggestion,
      reasoning: result.reasoning?.substring(0, 100)
    })

    if (!result.shouldAssist || !result.suggestion) {
      console.log('[WritingCoachAgent] ✋ No assistance needed')
      return { shouldAssist: false }
    }

    console.log('[WritingCoachAgent] ✅ Generating writing suggestion...')

    return {
      shouldAssist: true,
      suggestion: {
        type: 'writing',
        title: '✍️ Writing Assistant',
        content: result.suggestion,
        confidence: 0.75,
        timestamp: latestFrame?.timestamp || Date.now()
      },
      reasoning: result.reasoning
    }
  }
}
