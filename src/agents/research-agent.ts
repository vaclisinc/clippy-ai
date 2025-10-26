import { BaseAgent } from './base-agent'
import { BrightDataClient } from '../lib/bright-data'
import type { AgentResponse, Context, Screenshot, Config } from '../types'

export class ResearchAgent extends BaseAgent {
  private brightData: BrightDataClient | null = null

  constructor(client: any, config: Config) {
    super(client)

    if (config.brightDataApiKey) {
      try {
        this.brightData = new BrightDataClient(config.brightDataApiKey)
        console.log('[ResearchAgent] Bright Data client initialized')
      } catch (error) {
        console.warn('[ResearchAgent] Bright Data not available:', error)
      }
    }
  }

  async analyze(
    frames: Screenshot[],
    context: Context
  ): Promise<AgentResponse> {
    console.log('[ResearchAgent] 🔍 Analyzing research activity...')
    const contextStr = this.createContext(context)
    const latestFrame = frames[frames.length - 1]

    // First, get AI to understand what the user is researching
    const analysisResult = await this.client.analyze(
      frames,
      contextStr,
      'research' as any
    )

    if (!analysisResult.shouldAssist) {
      console.log('[ResearchAgent] ✋ No research assistance needed')
      return { shouldAssist: false }
    }

    console.log('[ResearchAgent] 📊 User appears to be researching')

    // If we have Bright Data, try to fetch additional resources
    let enhancedSuggestion = analysisResult.suggestion || ''

    if (this.brightData && analysisResult.suggestion) {
      try {
        // Extract keywords from the AI's analysis
        const keywords = this.brightData.extractKeywords(analysisResult.suggestion)

        if (keywords.length > 0) {
          const searchQuery = keywords.slice(0, 3).join(' ')
          console.log(`[ResearchAgent] 🌐 Searching Bright Data for: "${searchQuery}"`)

          const searchResults = await this.brightData.searchWeb(searchQuery, 3)

          if (searchResults.length > 0) {
            enhancedSuggestion += '\n\n**Related Resources:**\n'
            searchResults.forEach((result, index) => {
              enhancedSuggestion += `\n${index + 1}. [${result.title}](${result.url})`
              if (result.snippet) {
                enhancedSuggestion += `\n   ${result.snippet.substring(0, 100)}...`
              }
            })

            console.log(`[ResearchAgent] ✅ Added ${searchResults.length} Bright Data results`)
          }
        }
      } catch (error) {
        console.error('[ResearchAgent] Bright Data search failed:', error)
        // Continue with original suggestion if Bright Data fails
      }
    }

    return {
      shouldAssist: true,
      suggestion: {
        type: 'research',
        title: '🔍 Research Assistant',
        content: enhancedSuggestion,
        confidence: 0.7,
        timestamp: latestFrame?.timestamp || Date.now()
      },
      reasoning: analysisResult.reasoning
    }
  }
}
