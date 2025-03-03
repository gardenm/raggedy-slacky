import { Type } from 'class-transformer';
import { 
  IsArray, 
  IsEnum, 
  IsNumber, 
  IsObject, 
  IsOptional, 
  IsString, 
  MaxLength, 
  Min, 
  Max
} from 'class-validator';

export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

export class Message {
  @IsEnum(MessageRole)
  role: MessageRole;

  @IsString()
  @MaxLength(32000)
  content: string;
}

export class LlmRequestOptions {
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  temperature?: number = 0.7;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  topP?: number = 0.95;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxTokens?: number = 2048;

  @IsString()
  @IsOptional()
  model?: string;
}

export class LlmRequestDto {
  @IsArray()
  @Type(() => Message)
  messages: Message[];

  @IsObject()
  @IsOptional()
  @Type(() => LlmRequestOptions)
  options?: LlmRequestOptions;

  @IsString()
  @IsOptional()
  conversationId?: string;
}