import { config as dotenvConfig } from 'dotenv'
import type { Config } from '../types'

// Load environment variables
dotenvConfig()

export function loadConfig(): Config {
  const openRouterApiKey = process.env.OPENROUTER_API_KEY
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY

  if (!openRouterApiKey && !anthropicApiKey) {
    throw new Error('Either OPENROUTER_API_KEY or ANTHROPIC_API_KEY is required in .env file')
  }

  return {
    openRouterApiKey,
    anthropicApiKey,
    screenshotInterval: parseInt(process.env.SCREENSHOT_INTERVAL || '15', 10),
    idleThreshold: parseInt(process.env.IDLE_THRESHOLD || '180', 10),
    debug: process.env.DEBUG === 'true'
  }
}
