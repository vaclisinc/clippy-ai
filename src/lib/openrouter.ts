import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import type { Config, Screenshot } from '../types'

export class OpenRouterClient {
  private openRouterClient: OpenAI | null
  private anthropicClient: Anthropic | null

  constructor(config: Config) {
    this.openRouterClient = config.openRouterApiKey
      ? new OpenAI({
          apiKey: config.openRouterApiKey,
          baseURL: 'https://openrouter.ai/api/v1'
        })
      : null

    this.anthropicClient = config.anthropicApiKey
      ? new Anthropic({
          apiKey: config.anthropicApiKey
        })
      : null

    if (!this.openRouterClient && !this.anthropicClient) {
      throw new Error('No AI client configured. Provide OPENROUTER_API_KEY or ANTHROPIC_API_KEY.')
    }
  }

  /**
   * Clean markdown code blocks from JSON responses
   */
  private cleanJsonResponse(content: string): string {
    // Remove markdown code blocks (```json ... ``` or ``` ... ```)
    let cleaned = content.trim()

    // Remove opening code block
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '')

    // Remove closing code block
    cleaned = cleaned.replace(/\n?```\s*$/i, '')

    return cleaned.trim()
  }

  /**
   * Safely parse JSON with better error handling
   */
  private safeJsonParse(content: string): any {
    try {
      const cleaned = this.cleanJsonResponse(content)
      return JSON.parse(cleaned)
    } catch (error) {
      console.error('[OpenRouter] JSON parse error:', error)
      console.error('[OpenRouter] Raw content:', content.substring(0, 500) + '...')

      // Try to extract and fix JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          // Strategy: Parse the outer JSON structure, keeping suggestion as-is
          // Then manually extract fields
          let jsonStr = jsonMatch[0]

          // Extract shouldAssist (boolean)
          const shouldAssistMatch = jsonStr.match(/"shouldAssist"\s*:\s*(true|false)/)
          const shouldAssist = shouldAssistMatch ? shouldAssistMatch[1] === 'true' : false

          // Extract suggestion (everything between "suggestion": " and ", "reasoning")
          const suggestionMatch = jsonStr.match(/"suggestion"\s*:\s*"([\s\S]*?)",\s*"reasoning"/)
          let suggestion = suggestionMatch ? suggestionMatch[1] : null

          // If suggestion exists, unescape it properly
          if (suggestion) {
            // Remove markdown code blocks from suggestion
            suggestion = suggestion
              .replace(/```markdown\s*/g, '')
              .replace(/```\s*/g, '')
              .replace(/\\n/g, '\n')  // Convert \\n to actual newlines
              .replace(/\\"/g, '"')   // Unescape quotes
              .replace(/\\\\/g, '\\') // Unescape backslashes
          }

          // Extract reasoning
          const reasoningMatch = jsonStr.match(/"reasoning"\s*:\s*"([\s\S]*?)"[\s\S]*\}/)
          const reasoning = reasoningMatch ? reasoningMatch[1] : null

          console.log('[OpenRouter] ✅ Manual parse succeeded!')
          return {
            shouldAssist,
            suggestion,
            reasoning
          }
        } catch (e) {
          console.error('[OpenRouter] Manual parse also failed:', e)
        }
      }

      // Return default safe values
      console.error('[OpenRouter] ❌ All parse attempts failed, returning empty')
      return {}
    }
  }

  private buildOpenAIImageBlocks(frames: Screenshot[]): Array<{
    type: 'image_url'
    image_url: { url: string; detail?: 'low' | 'high' }
  }> {
    return frames.map((frame) => ({
      type: 'image_url' as const,
      image_url: {
        url: `data:image/png;base64,${frame.buffer.toString('base64')}`,
        detail: 'low'
      }
    }))
  }

  private buildAnthropicImageBlocks(frames: Screenshot[]): Array<{
    type: 'image'
    source: { type: 'base64'; media_type: 'image/png'; data: string }
  }> {
    return frames.map((frame) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: 'image/png' as const,
        data: frame.buffer.toString('base64')
      }
    }))
  }

  /**
   * Quick classification using GPT-4o mini (cheap and fast)
   */
  async classify(frames: Screenshot[]): Promise<{
    classification: 'error' | 'idle' | 'normal'
    confidence: number
  }> {
    if (frames.length === 0) {
      throw new Error('No frames supplied for classification')
    }

    if (this.openRouterClient) {
      return this.classifyWithOpenRouter(frames)
    }

    if (this.anthropicClient) {
      return this.classifyWithAnthropic(frames)
    }

    throw new Error('No classification client available.')
  }

  private async classifyWithOpenRouter(
    frames: Screenshot[]
  ): Promise<{
    classification: 'error' | 'idle' | 'normal'
    confidence: number
  }> {
    if (!this.openRouterClient) {
      throw new Error('OpenRouter client not configured')
    }

    const messageContent = [
      ...this.buildOpenAIImageBlocks(frames),
      {
        type: 'text',
        text: `You are given ${frames.length} sequential screenshots captured roughly one second apart (oldest first). Analyze the sequence to detect if the user encountered an error, appears idle, or is working normally.

Return JSON: {"classification":"error|idle|normal","confidence":0.0-1.0}`
      }
    ] as any

    const response = await this.openRouterClient.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: messageContent
        }
      ],
      max_tokens: 100,
      temperature: 0.3
    })

    const responseContent = response.choices[0]?.message?.content || '{}'
    const result = this.safeJsonParse(responseContent)

    return {
      classification: result.classification || 'normal',
      confidence: result.confidence || 0.5
    }
  }

  private async classifyWithAnthropic(
    frames: Screenshot[]
  ): Promise<{
    classification: 'error' | 'idle' | 'normal'
    confidence: number
  }> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not configured')
    }

    const messageContent = [
      ...this.buildAnthropicImageBlocks(frames),
      {
        type: 'text',
        text: `You are given ${frames.length} sequential screenshots captured roughly one second apart (oldest first). Classify the overall activity as:
- "error": visible error messages, exceptions, stack traces
- "idle": minimal change, user likely reading or waiting
- "normal": active work or browsing

Respond in JSON: {"classification":"error|idle|normal","confidence":0.0-1.0}`
      }
    ] as any

    const response = await this.anthropicClient.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 200,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: messageContent
        }
      ]
    })

    const responseContent = this.extractTextFromAnthropic(response.content)
    const result = this.safeJsonParse(responseContent || '{}')

    return {
      classification: result.classification || 'normal',
      confidence: result.confidence || 0.5
    }
  }

  /**
   * Deep analysis using Claude Sonnet (powerful reasoning)
   */
  async analyze(
    frames: Screenshot[],
    context: string,
    agentType: 'debug' | 'learning'
  ): Promise<{
    shouldAssist: boolean
    suggestion?: string
    reasoning?: string
  }> {
    if (frames.length === 0) {
      throw new Error('No frames supplied for analysis')
    }

    if (this.anthropicClient) {
      return this.analyzeWithAnthropic(frames, context, agentType)
    }

    if (!this.openRouterClient) {
      throw new Error('No AI client available for analysis.')
    }

    return this.analyzeWithOpenRouter(frames, context, agentType)
  }

  private async analyzeWithOpenRouter(
    frames: Screenshot[],
    context: string,
    agentType: 'debug' | 'learning'
  ): Promise<{
    shouldAssist: boolean
    suggestion?: string
    reasoning?: string
  }> {
    if (!this.openRouterClient) {
      throw new Error('OpenRouter client not configured')
    }

    const prompts = {
      debug: `You are a helpful debugging assistant. Analyze this sequence of screenshots for errors or issues.

If you see error messages, exceptions, or problems:
1. Identify the error type and cause
2. Suggest specific solutions
3. Provide actionable next steps

Respond in JSON:
{
  "shouldAssist": true/false,
  "suggestion": "your helpful suggestion in markdown",
  "reasoning": "why you decided to help or not"
}`,
      learning: `You are a patient learning assistant. The user has been viewing this content for a while.

If the content seems complex or the user might benefit from explanation:
1. Identify what they're reading/learning
2. Provide a clear, simple explanation (ELI5 style)
3. Offer additional resources if helpful

Respond in JSON:
{
  "shouldAssist": true/false,
  "suggestion": "your explanation in markdown",
  "reasoning": "why you decided to help or not"
}`
    }

    const messageContent = [
      ...this.buildOpenAIImageBlocks(frames),
      {
        type: 'text',
        text: `${prompts[agentType]}\n\nScreenshots are chronological (oldest first) and captured about one second apart.\n\nContext: ${context}`
      }
    ] as any

    const response = await this.openRouterClient.chat.completions.create({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        {
          role: 'user',
          content: messageContent
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })

    const responseContent = response.choices[0]?.message?.content || '{}'
    const result = this.safeJsonParse(responseContent)

    return {
      shouldAssist: result.shouldAssist || false,
      suggestion: result.suggestion,
      reasoning: result.reasoning
    }
  }

  private async analyzeWithAnthropic(
    frames: Screenshot[],
    context: string,
    agentType: 'debug' | 'learning'
  ): Promise<{
    shouldAssist: boolean
    suggestion?: string
    reasoning?: string
  }> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not configured')
    }

    const prompts = {
      debug: `You are a helpful debugging assistant. Analyze this sequence of screenshots for errors or issues.

If you see error messages, exceptions, or problems:
1. Identify the error type and cause
2. Suggest specific solutions
3. Provide actionable next steps

Respond in JSON:
{
  "shouldAssist": true/false,
  "suggestion": "your helpful suggestion in markdown",
  "reasoning": "why you decided to help or not"
}`,
      learning: `You are a patient learning assistant. The user has been viewing this content for a while.

If the content seems complex or the user might benefit from explanation:
1. Identify what they're reading/learning
2. Provide a clear, simple explanation (ELI5 style)
3. Offer additional resources if helpful

Respond in JSON:
{
  "shouldAssist": true/false,
  "suggestion": "your explanation in markdown",
  "reasoning": "why you decided to help or not"
}`
    }

    const messageContent = [
      ...this.buildAnthropicImageBlocks(frames),
      {
        type: 'text',
        text: `${prompts[agentType]}\n\nScreenshots are chronological (oldest first) and captured about one second apart.\n\nContext: ${context}`
      }
    ] as any

    const response = await this.anthropicClient.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: messageContent
        }
      ]
    })

    const responseContent = this.extractTextFromAnthropic(response.content)
    const result = this.safeJsonParse(responseContent || '{}')

    return {
      shouldAssist: result.shouldAssist || false,
      suggestion: result.suggestion,
      reasoning: result.reasoning
    }
  }

  private extractTextFromAnthropic(
    blocks: Array<{ type?: string; text?: string }>
  ): string {
    if (!Array.isArray(blocks)) {
      return ''
    }

    return blocks
      .map(block => {
        if (block && block.type === 'text' && typeof block.text === 'string') {
          return block.text
        }
        return ''
      })
      .filter(Boolean)
      .join('\n')
      .trim()
  }
}
