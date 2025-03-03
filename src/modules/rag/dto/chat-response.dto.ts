import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { LlmResponseMetadata, Citation } from './llm-response.dto';

export enum ChatIntentType {
  SEARCH = 'search',
  CONVERSATION = 'conversation',
  SUMMARIZATION = 'summarization',
}

export class SourceReference {
  @IsString()
  text: string;

  @IsString()
  @IsOptional()
  channel?: string;

  @IsString()
  @IsOptional()
  user?: string;

  @IsString()
  @IsOptional()
  timestamp?: string;

  @IsNumber()
  @IsOptional()
  relevanceScore?: number;
}

export class ChatResponseDto {
  @IsString()
  message: string;

  @IsEnum(ChatIntentType)
  intent: ChatIntentType;

  @IsNumber()
  sources: number;

  @IsArray()
  @IsOptional()
  @Type(() => SourceReference)
  references?: SourceReference[];

  @IsObject()
  @IsOptional()
  metadata?: LlmResponseMetadata;

  @IsString()
  @IsOptional()
  conversationId?: string;
}