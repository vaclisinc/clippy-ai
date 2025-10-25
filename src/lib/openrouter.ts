import OpenAI from 'openai'
import type { Config } from '../types'

export class OpenRouterClient {
  private client: OpenAI

  constructor(config: Config) {
    this.client = new OpenAI({
      apiKey: config.openRouterApiKey,
      baseURL: 'https://openrouter.ai/api/v1'
    })
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

  /**
   * Quick classification using GPT-4o mini (cheap and fast)
   */
  async classify(screenshot: Buffer): Promise<{
    classification: 'error' | 'idle' | 'normal'
    confidence: number
  }> {
    const base64Image = screenshot.toString('base64')

    const response = await this.client.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            },
            {
              type: 'text',
              text: `Classify this screenshot into ONE of these categories:
- "error": Contains error messages, red text, exceptions, stack traces
- "idle": Same content for extended time, user reading/stuck
- "normal": Active work, coding, browsing normally

Respond in JSON: {"classification": "error|idle|normal", "confidence": 0.0-1.0}`
            }
          ]
        }
      ],
      max_tokens: 100,
      temperature: 0.3
    })

    const content = response.choices[0]?.message?.content || '{}'
    const result = this.safeJsonParse(content)

    return {
      classification: result.classification || 'normal',
      confidence: result.confidence || 0.5
    }
  }

  /**
   * Deep analysis using Claude Sonnet (powerful reasoning)
   */
  async analyze(
    screenshot: Buffer,
    context: string,
    agentType: 'debug' | 'learning'
  ): Promise<{
    shouldAssist: boolean
    suggestion?: string
    reasoning?: string
  }> {
    const base64Image = screenshot.toString('base64')

    const prompts = {
      debug: `You are a helpful debugging assistant. Analyze this screenshot for errors or issues.

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

    const response = await this.client.chat.completions.create({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            },
            {
              type: 'text',
              text: `${prompts[agentType]}\n\nContext: ${context}`
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })

    const content = response.choices[0]?.message?.content || '{}'
    const result = this.safeJsonParse(content)

    return {
      shouldAssist: result.shouldAssist || false,
      suggestion: result.suggestion,
      reasoning: result.reasoning
    }
  }
}
