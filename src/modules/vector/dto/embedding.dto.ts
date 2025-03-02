import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

/**
 * Data Transfer Object for adding embeddings
 */
export class AddEmbeddingDto {
  /**
   * Unique ID for the embedding
   */
  @IsString()
  @IsNotEmpty()
  id: string;

  /**
   * Vector embedding
   */
  @IsArray()
  @IsNotEmpty()
  embedding: number[];

  /**
   * Original document content
   */
  @IsString()
  @IsOptional()
  document?: string;

  /**
   * Metadata for the document
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Data Transfer Object for bulk adding embeddings
 */
export class BulkAddEmbeddingsDto {
  /**
   * Array of embeddings to add
   */
  @IsArray()
  @IsNotEmpty()
  embeddings: AddEmbeddingDto[];
}