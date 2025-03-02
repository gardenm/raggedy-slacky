import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, Collection } from 'chromadb';
import { VectorSearchParams } from './interfaces/search-params.interface';
import { VectorSearchResult, VectorSearchResults } from './interfaces/search-result.interface';

/**
 * Service for interacting with the Chroma vector database
 */
@Injectable()
export class VectorService implements OnModuleInit {
  private readonly logger = new Logger(VectorService.name);
  private client: ChromaClient;
  private collections: Map<string, Collection> = new Map();
  private defaultCollection = 'messages';

  constructor(private configService: ConfigService) {}

  /**
   * Initialize the Chroma client and create default collections on module initialization
   */
  async onModuleInit() {
    try {
      const host = this.configService.get<string>('chroma.host', 'localhost');
      const port = this.configService.get<number>('chroma.port', 8000);
      const url = `http://${host}:${port}`;
      
      this.logger.log(`Initializing Chroma client with URL: ${url}`);
      this.client = new ChromaClient({ path: url });
      
      // Create default collections
      await this.initializeCollections();
      
      this.logger.log('Chroma vector database initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize Chroma client: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Initialize default collections
   * @private
   */
  private async initializeCollections() {
    try {
      const collections = ['messages', 'users', 'channels', 'files'];
      
      for (const name of collections) {
        this.logger.log(`Ensuring collection exists: ${name}`);
        const collection = await this.client.getOrCreateCollection({
          name,
          metadata: { description: `${name} collection` }
        });
        
        this.collections.set(name, collection);
      }
      
      this.logger.log(`Initialized ${collections.length} collections`);
    } catch (error) {
      this.logger.error(`Failed to initialize collections: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a collection by name
   * @param name Collection name
   * @returns The collection
   */
  async getCollection(name: string): Promise<Collection> {
    if (this.collections.has(name)) {
      const collection = this.collections.get(name);
      if (collection) {
        return collection;
      }
    }
    
    try {
      // For newer versions of chromadb, we need to specify an embeddingFunction
      // Even if we'll be providing pre-computed embeddings
      const collection = await this.client.getOrCreateCollection({
        name,
        metadata: { description: `${name} collection` }
      });
      
      this.collections.set(name, collection);
      return collection;
    } catch (error) {
      this.logger.error(`Failed to get collection '${name}': ${error.message}`);
      throw new Error(`Collection '${name}' not found`);
    }
  }

  /**
   * Add embeddings to a collection
   * @param collectionName Collection name
   * @param items Items to add (ids, embeddings, documents, metadata)
   */
  async addEmbeddings(
    collectionName: string,
    items: {
      ids: string[];
      embeddings: number[][];
      documents?: string[];
      metadatas?: Record<string, any>[];
    }
  ): Promise<void> {
    try {
      const collection = await this.getCollection(collectionName);
      
      await collection.add({
        ids: items.ids,
        embeddings: items.embeddings,
        documents: items.documents,
        metadatas: items.metadatas
      });
      
      this.logger.debug(`Added ${items.ids.length} embeddings to '${collectionName}' collection`);
    } catch (error) {
      this.logger.error(`Failed to add embeddings to '${collectionName}': ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update embeddings in a collection
   * @param collectionName Collection name
   * @param items Items to update
   */
  async updateEmbeddings(
    collectionName: string,
    items: {
      ids: string[];
      embeddings?: number[][];
      documents?: string[];
      metadatas?: Record<string, any>[];
    }
  ): Promise<void> {
    try {
      const collection = await this.getCollection(collectionName);
      
      await collection.update({
        ids: items.ids,
        embeddings: items.embeddings,
        documents: items.documents,
        metadatas: items.metadatas
      });
      
      this.logger.debug(`Updated ${items.ids.length} embeddings in '${collectionName}' collection`);
    } catch (error) {
      this.logger.error(`Failed to update embeddings in '${collectionName}': ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete embeddings from a collection
   * @param collectionName Collection name
   * @param ids IDs of items to delete
   */
  async deleteEmbeddings(collectionName: string, ids: string[]): Promise<void> {
    try {
      const collection = await this.getCollection(collectionName);
      await collection.delete({ ids });
      
      this.logger.debug(`Deleted ${ids.length} embeddings from '${collectionName}' collection`);
    } catch (error) {
      this.logger.error(`Failed to delete embeddings from '${collectionName}': ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Search for similar items
   * @param params Search parameters
   * @returns Search results
   */
  async search(params: VectorSearchParams): Promise<VectorSearchResults> {
    const {
      queryText,
      queryEmbedding,
      limit = 10,
      filters = {},
      collection = this.defaultCollection,
      includeContent = true,
      includeEmbeddings = false,
      includeMetadata = true,
    } = params;

    if (!queryText && !queryEmbedding) {
      throw new Error('Either queryText or queryEmbedding must be provided');
    }

    try {
      const collectionObj = await this.getCollection(collection);
      
      const include = [];
      if (includeContent) include.push('documents');
      if (includeEmbeddings) include.push('embeddings'); 
      if (includeMetadata) include.push('metadatas');
      
      const queryParams: any = {
        nResults: limit,
        include
      };
      
      // Add filters if provided
      if (Object.keys(filters).length > 0) {
        queryParams.where = filters;
      }
      
      // Add query text or embedding
      if (queryText) {
        queryParams.queryTexts = [queryText];
      } else if (queryEmbedding) {
        queryParams.queryEmbeddings = [queryEmbedding];
      }
      
      const result = await collectionObj.query(queryParams);
      
      // Format results
      const formattedResults: VectorSearchResult[] = [];
      
      if (result.ids && result.ids.length > 0) {
        const { ids, documents, embeddings, metadatas, distances } = result;
        
        for (let i = 0; i < ids[0].length; i++) {
          const formattedResult: VectorSearchResult = {
            id: ids[0][i],
            score: distances ? 1 - distances[0][i] : 1, // Convert distance to similarity score
          };
          
          if (includeContent && documents && documents[0][i] !== null) {
            formattedResult.content = documents[0][i] || undefined;
          }
          
          if (includeEmbeddings && embeddings) {
            formattedResult.embedding = embeddings[0][i];
          }
          
          if (includeMetadata && metadatas && metadatas[0][i] !== null) {
            formattedResult.metadata = metadatas[0][i] || undefined;
          }
          
          formattedResults.push(formattedResult);
        }
      }
      
      return {
        results: formattedResults,
        total: result.ids ? result.ids[0].length : 0,
        count: formattedResults.length
      };
    } catch (error) {
      this.logger.error(`Search error in collection '${collection}': ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get count of items in a collection
   * @param collectionName Collection name
   * @returns Count of items
   */
  async getCount(collectionName: string): Promise<number> {
    try {
      const collection = await this.getCollection(collectionName);
      const result = await collection.count();
      return result;
    } catch (error) {
      this.logger.error(`Failed to get count from '${collectionName}': ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check if the vector database is healthy
   * @returns True if healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const collections = await this.client.listCollections();
      return collections.length >= 0;
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);
      return false;
    }
  }
}