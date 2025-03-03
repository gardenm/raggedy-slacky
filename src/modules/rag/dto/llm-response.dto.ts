import { IsArray, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class LlmResponseMetadata {
  @IsNumber()
  promptTokens: number;

  @IsNumber()
  completionTokens: number;

  @IsNumber()
  totalTokens: number;

  @IsString()
  @IsOptional()
  model?: string;

  @IsNumber()
  @IsOptional()
  latencyMs?: number;
}

export class Citation {
  @IsString()
  text: string;
  
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
  
  @IsNumber()
  @IsOptional()
  relevanceScore?: number;
}

export class LlmResponseDto {
  @IsString()
  content: string;

  @IsObject()
  metadata: LlmResponseMetadata;
  
  @IsArray()
  @IsOptional()
  citations?: Citation[];
  
  @IsString()
  @IsOptional()
  conversationId?: string;
}