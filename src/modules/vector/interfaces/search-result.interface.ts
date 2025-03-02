/**
 * Interface defining a single search result from vector search
 */
export interface VectorSearchResult {
  /**
   * Unique identifier of the document
   */
  id: string;

  /**
   * Original document content
   */
  content?: string;

  /**
   * Embedding vector of the document
   */
  embedding?: number[];

  /**
   * Similarity score (0-1) with higher being more similar
   */
  score: number;

  /**
   * Metadata associated with the document
   */
  metadata?: Record<string, any>;
}

/**
 * Interface defining the complete search results
 */
export interface VectorSearchResults {
  /**
   * Array of search results
   */
  results: VectorSearchResult[];

  /**
   * Total number of results found
   */
  total: number;

  /**
   * Total number of results returned (may be limited)
   */
  count: number;
}