import { OpenRouterClient } from '../lib/openrouter'
import { DebugAgent } from './debug-agent'
import { LearningAgent } from './learning-agent'
import { WritingCoachAgent } from './writing-coach-agent'
import { ResearchAgent } from './research-agent'
import type {
  AgentResponse,
  Context,
  Screenshot,
  ClassificationResult,
  Config
} from '../types'

export class AgentRouter {
  private client: OpenRouterClient
  private debugAgent: DebugAgent
  private learningAgent: LearningAgent
  private writingCoachAgent: WritingCoachAgent
  private researchAgent: ResearchAgent

  constructor(config: Config) {
    this.client = new OpenRouterClient(config)
    this.debugAgent = new DebugAgent(this.client)
    this.learningAgent = new LearningAgent(this.client, config)
    this.writingCoachAgent = new WritingCoachAgent(this.client)
    this.researchAgent = new ResearchAgent(this.client, config)
  }

  async route(
    frames: Screenshot[],
    context: Context
  ): Promise<AgentResponse> {
    try {
      if (frames.length === 0) {
        console.warn('[Router] ⚠️ No frames provided for routing')
        return { shouldAssist: false }
      }

      // Step 1: Quick classification
      console.log(
        `[Router] 🔍 Classifying frame batch (${frames.length} frames)...`
      )
      const classification = await this.quickScreen(frames)

      console.log(`[Router] 📋 Result: "${classification.classification}" (confidence: ${(classification.confidence * 100).toFixed(0)}%)`)

      // Step 2: If normal, no need to assist
      if (classification.classification === 'normal') {
        console.log('[Router] ✅ Looks normal, no action needed')
        return { shouldAssist: false, classification: 'normal' }
      }

      // Step 3: Route to appropriate agent based on classification
      switch (classification.classification) {
        case 'error': {
          console.log('[Router] 🐛 Routing to Debug Agent...')
          const response = await this.debugAgent.analyze(frames, context)
          return { ...response, classification: 'error' }
        }

        case 'idle': {
          console.log('[Router] 📚 Routing to Learning Agent...')
          const response = await this.learningAgent.analyze(frames, context)
          return { ...response, classification: 'idle' }
        }

        case 'writing': {
          console.log('[Router] ✍️ Routing to Writing Coach Agent...')
          const response = await this.writingCoachAgent.analyze(frames, context)
          return { ...response, classification: 'writing' }
        }

        case 'research': {
          console.log('[Router] 🔍 Routing to Research Agent...')
          const response = await this.researchAgent.analyze(frames, context)
          return { ...response, classification: 'research' }
        }

        case 'code':
          console.log('[Router] 💻 Code detected but no specific agent yet')
          // TODO: Add SecurityAgent when implemented
          return { shouldAssist: false, classification: 'code' }

        default:
          return { shouldAssist: false, classification: 'normal' }
      }
    } catch (error) {
      console.error('[AgentRouter] ❌ Error routing request:', error)
      return { shouldAssist: false }
    }
  }

  private async quickScreen(
    frames: Screenshot[]
  ): Promise<ClassificationResult> {
    try {
      const result = await this.client.classify(frames)

      return {
        classification: result.classification,
        confidence: result.confidence
      }
    } catch (error) {
      console.error('[AgentRouter] Classification error:', error)
      // Default to normal if classification fails
      return {
        classification: 'normal',
        confidence: 0
      }
    }
  }
}
