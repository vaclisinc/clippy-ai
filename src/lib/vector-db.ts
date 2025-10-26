import { ChromaClient, Collection } from 'chromadb'
import { randomUUID } from 'crypto'
import type {
  Screenshot,
  ScreenshotMetadata,
  VectorSearchResult,
  EventClassification
} from '../types'

export class VectorDB {
  private client: ChromaClient
  private collection: Collection | null = null
  private collectionName = 'screenshot-embeddings'

  constructor() {
    // Connect to ChromaDB server running on localhost:8000
    this.client = new ChromaClient({
      path: 'http://localhost:8000'
    })
  }

  async initialize(): Promise<void> {
    try {
      // Delete existing collection if it exists (to recreate with correct settings)
      try {
        await this.client.deleteCollection({ name: this.collectionName })
        console.log('[VectorDB] Deleted existing collection for recreation')
      } catch (error) {
        // Collection doesn't exist, that's fine
      }

      // Create collection - ChromaDB server will use default embeddings
      this.collection = await this.client.createCollection({
        name: this.collectionName,
        metadata: { description: 'Screenshot embeddings for semantic search' }
        // Don't specify embeddingFunction - server will use default
      })
      console.log('[VectorDB] Created new collection:', this.collectionName)
    } catch (error) {
      console.error('[VectorDB] Failed to initialize:', error)
      throw error
    }
  }

  /**
   * Add a screenshot with its description and metadata to the vector database
   */
  async addScreenshot(
    _screenshot: Screenshot,
    description: string,
    metadata: Omit<ScreenshotMetadata, 'id' | 'description'>
  ): Promise<string> {
    if (!this.collection) {
      throw new Error('[VectorDB] Collection not initialized')
    }

    const id = randomUUID()

    try {
      await this.collection.add({
        ids: [id],
        documents: [description],
        metadatas: [
          {
            filePath: metadata.filePath,
            timestamp: metadata.timestamp,
            classification: metadata.classification,
            currentApp: metadata.currentApp || 'unknown',
            width: metadata.width,
            height: metadata.height
          }
        ]
      })

      console.log('[VectorDB] Added screenshot:', {
        id,
        timestamp: new Date(metadata.timestamp).toLocaleString(),
        classification: metadata.classification
      })

      return id
    } catch (error) {
      console.error('[VectorDB] Failed to add screenshot:', error)
      throw error
    }
  }

  /**
   * Search for similar screenshots using semantic search
   */
  async searchSimilar(
    query: string,
    limit: number = 5,
    filterByClassification?: EventClassification
  ): Promise<VectorSearchResult[]> {
    if (!this.collection) {
      throw new Error('[VectorDB] Collection not initialized')
    }

    try {
      const results = await this.collection.query({
        queryTexts: [query],
        nResults: limit,
        where: filterByClassification
          ? { classification: filterByClassification }
          : undefined
      })

      if (
        !results.ids ||
        !results.metadatas ||
        !results.distances ||
        results.ids[0].length === 0
      ) {
        return []
      }

      const searchResults: VectorSearchResult[] = []

      for (let i = 0; i < results.ids[0].length; i++) {
        const metadata = results.metadatas[0][i] as any
        const distance = results.distances?.[0][i] || 0

        searchResults.push({
          metadata: {
            id: results.ids[0][i],
            filePath: metadata.filePath,
            timestamp: metadata.timestamp,
            classification: metadata.classification as EventClassification,
            description: results.documents?.[0][i] || undefined,
            currentApp: metadata.currentApp,
            width: metadata.width,
            height: metadata.height
          },
          similarity: 1 - distance // Convert distance to similarity
        })
      }

      console.log(`[VectorDB] Found ${searchResults.length} similar screenshots for query: "${query}"`)

      return searchResults
    } catch (error) {
      console.error('[VectorDB] Search failed:', error)
      return []
    }
  }

  /**
   * Get screenshots within a time window for context
   */
  async getContext(
    timestamp: number,
    windowMs: number = 5 * 60 * 1000 // 5 minutes default
  ): Promise<VectorSearchResult[]> {
    if (!this.collection) {
      throw new Error('[VectorDB] Collection not initialized')
    }

    try {
      // ChromaDB doesn't support range queries directly, so we get all and filter
      const allResults = await this.collection.get({
        limit: 1000 // reasonable limit
      })

      if (!allResults.ids || !allResults.metadatas) {
        return []
      }

      const contextResults: VectorSearchResult[] = []
      const startTime = timestamp - windowMs / 2
      const endTime = timestamp + windowMs / 2

      for (let i = 0; i < allResults.ids.length; i++) {
        const metadata = allResults.metadatas[i] as any
        const screenshotTime = metadata.timestamp

        if (screenshotTime >= startTime && screenshotTime <= endTime) {
          contextResults.push({
            metadata: {
              id: allResults.ids[i],
              filePath: metadata.filePath,
              timestamp: metadata.timestamp,
              classification: metadata.classification as EventClassification,
              description: allResults.documents?.[i] || undefined,
              currentApp: metadata.currentApp,
              width: metadata.width,
              height: metadata.height
            },
            similarity: 1.0 // All within window
          })
        }
      }

      // Sort by timestamp
      contextResults.sort((a, b) => a.metadata.timestamp - b.metadata.timestamp)

      console.log(
        `[VectorDB] Found ${contextResults.length} screenshots in ${windowMs / 1000}s window around ${new Date(timestamp).toLocaleString()}`
      )

      return contextResults
    } catch (error) {
      console.error('[VectorDB] Get context failed:', error)
      return []
    }
  }

  /**
   * Get total count of stored screenshots
   */
  async getCount(): Promise<number> {
    if (!this.collection) {
      return 0
    }

    try {
      const result = await this.collection.count()
      return result
    } catch (error) {
      console.error('[VectorDB] Failed to get count:', error)
      return 0
    }
  }

  /**
   * Delete old screenshots to manage storage
   */
  async pruneOldScreenshots(olderThanMs: number): Promise<number> {
    if (!this.collection) {
      return 0
    }

    try {
      const cutoffTime = Date.now() - olderThanMs
      const allResults = await this.collection.get()

      if (!allResults.ids || !allResults.metadatas) {
        return 0
      }

      const idsToDelete: string[] = []

      for (let i = 0; i < allResults.ids.length; i++) {
        const metadata = allResults.metadatas[i] as any
        if (metadata.timestamp < cutoffTime) {
          idsToDelete.push(allResults.ids[i])
        }
      }

      if (idsToDelete.length > 0) {
        await this.collection.delete({ ids: idsToDelete })
        console.log(`[VectorDB] Pruned ${idsToDelete.length} old screenshots`)
      }

      return idsToDelete.length
    } catch (error) {
      console.error('[VectorDB] Failed to prune old screenshots:', error)
      return 0
    }
  }

  async close(): Promise<void> {
    console.log('[VectorDB] Closing connection')
    // ChromaClient doesn't require explicit close in current version
  }
}
