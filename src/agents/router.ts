import { OpenRouterClient } from '../lib/openrouter'
import { DebugAgent } from './debug-agent'
import { LearningAgent } from './learning-agent'
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
  private config: Config

  constructor(config: Config) {
    this.config = config
    this.client = new OpenRouterClient(config)
    this.debugAgent = new DebugAgent(this.client)
    this.learningAgent = new LearningAgent(this.client, config)
  }

  async route(
    screenshot: Screenshot,
    context: Context
  ): Promise<AgentResponse> {
    try {
      // Step 1: Quick classification
      console.log('[Router] 🔍 Classifying screenshot...')
      const classification = await this.quickScreen(screenshot)

      console.log(`[Router] 📋 Result: "${classification.classification}" (confidence: ${(classification.confidence * 100).toFixed(0)}%)`)

      // Step 2: If normal, no need to assist
      if (classification.classification === 'normal') {
        console.log('[Router] ✅ Looks normal, no action needed')
        return { shouldAssist: false }
      }

      // Step 3: Route to appropriate agent
      if (classification.classification === 'error') {
        console.log('[Router] 🐛 Routing to Debug Agent...')
        return await this.debugAgent.analyze(screenshot, context)
      }

      if (classification.classification === 'idle') {
        console.log('[Router] 📚 Routing to Learning Agent...')
        return await this.learningAgent.analyze(screenshot, context)
      }

      return { shouldAssist: false }
    } catch (error) {
      console.error('[AgentRouter] ❌ Error routing request:', error)
      return { shouldAssist: false }
    }
  }

  private async quickScreen(
    screenshot: Screenshot
  ): Promise<ClassificationResult> {
    try {
      const result = await this.client.classify(screenshot.buffer)

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
