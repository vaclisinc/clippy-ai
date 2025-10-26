import axios from 'axios'

export interface BrightDataResult {
  title: string
  url: string
  snippet: string
  content?: string
}

export class BrightDataClient {
  // Reserved for future Bright Data API integration
  // private apiKey: string
  // private baseURL = 'https://api.brightdata.com/datasets/v3'

  constructor(apiKey?: string) {
    if (!apiKey) {
      console.warn('[BrightData] No API key provided, using fallback search')
    }
    // this.apiKey = apiKey
  }

  /**
   * Search the web using Bright Data's web scraper
   * This is a simplified implementation - in production you'd use their actual API
   */
  async searchWeb(query: string, limit: number = 5): Promise<BrightDataResult[]> {
    try {
      console.log(`[BrightData] Searching for: "${query}"`)

      // Note: This is a mock implementation since we need actual Bright Data credentials
      // In a real implementation, you would use Bright Data's actual API endpoints

      // For MVP/demo purposes, we'll use a fallback web search
      // You should replace this with actual Bright Data API calls when you have credentials

      const fallbackResults = await this.fallbackSearch(query, limit)

      console.log(`[BrightData] Found ${fallbackResults.length} results`)
      return fallbackResults
    } catch (error) {
      console.error('[BrightData] Search failed:', error)
      return []
    }
  }

  /**
   * Scrape a specific URL using Bright Data
   */
  async scrapeURL(url: string): Promise<string> {
    try {
      console.log(`[BrightData] Scraping URL: ${url}`)

      // Mock implementation - replace with actual Bright Data scraper API
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        timeout: 10000
      })

      // Extract text content (simplified)
      const content = this.extractText(response.data)

      console.log(`[BrightData] Scraped ${content.length} characters`)
      return content
    } catch (error) {
      console.error('[BrightData] Scraping failed:', error)
      return ''
    }
  }

  /**
   * Fallback search using DuckDuckGo (for demo without Bright Data credentials)
   * Replace this with actual Bright Data API when ready
   */
  private async fallbackSearch(query: string, limit: number): Promise<BrightDataResult[]> {
    try {
      // Using DuckDuckGo's instant answer API as a fallback
      const response = await axios.get('https://api.duckduckgo.com/', {
        params: {
          q: query,
          format: 'json',
          no_html: 1,
          skip_disambig: 1
        },
        timeout: 5000
      })

      const results: BrightDataResult[] = []

      // Extract related topics
      if (response.data.RelatedTopics) {
        for (const topic of response.data.RelatedTopics.slice(0, limit)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.substring(0, 100),
              url: topic.FirstURL,
              snippet: topic.Text,
              content: topic.Text
            })
          }
        }
      }

      // Add abstract if available
      if (response.data.Abstract && results.length < limit) {
        results.unshift({
          title: response.data.Heading || 'Overview',
          url: response.data.AbstractURL || '',
          snippet: response.data.Abstract,
          content: response.data.Abstract
        })
      }

      return results
    } catch (error) {
      console.error('[BrightData] Fallback search failed:', error)
      return []
    }
  }

  /**
   * Extract readable text from HTML
   */
  private extractText(html: string): string {
    // Very basic HTML tag removal - in production use a proper parser
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000) // Limit to 5000 chars
  }

  /**
   * Extract keywords from a screenshot description for search
   */
  extractKeywords(description: string): string[] {
    // Simple keyword extraction - remove common words
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'is', 'was', 'are', 'were', 'has', 'have', 'had', 'be', 'been',
      'this', 'that', 'these', 'those', 'with', 'from', 'by', 'of'
    ])

    const words = description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word))

    // Return top 5 keywords
    return [...new Set(words)].slice(0, 5)
  }
}
