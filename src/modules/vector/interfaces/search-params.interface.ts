/**
 * Interface defining parameters for vector similarity search
 */
export interface VectorSearchParams {
  /**
   * Query text to search for
   */
  queryText?: string;

  /**
   * Pre-computed embedding vector to search for
   */
  queryEmbedding?: number[];

  /**
   * Maximum number of results to return
   * @default 10
   */
  limit?: number;

  /**
   * Optional metadata filters to apply
   */
  filters?: Record<string, any>;

  /**
   * Collection to search in
   * @default 'messages'
   */
  collection?: string;

  /**
   * Optional minimum similarity score threshold (0-1)
   */
  minScore?: number;

  /**
   * Whether to include the document content in results
   * @default true
   */
  includeContent?: boolean;

  /**
   * Whether to include embeddings in results
   * @default false
   */
  includeEmbeddings?: boolean;

  /**
   * Whether to include metadata in results
   * @default true
   */
  includeMetadata?: boolean;
}