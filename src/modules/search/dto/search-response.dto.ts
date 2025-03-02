import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class SearchResultUserDto {
  @IsNumber()
  id: number;

  @IsString()
  username: string;

  @IsString()
  @IsOptional()
  realName?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}

export class SearchResultChannelDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}

export class SearchResultItemDto {
  @IsNumber()
  id: number;

  @IsString()
  content: string;

  @IsDate()
  timestamp: Date;

  @IsString()
  slackMessageId: string;

  @IsString()
  @IsOptional()
  threadTs?: string;

  @IsObject()
  slackUser: SearchResultUserDto;

  @IsObject()
  channel: SearchResultChannelDto;

  @IsNumber()
  score: number;
  
  @IsBoolean()
  @IsOptional()
  hasAttachments?: boolean;
  
  @IsBoolean()
  @IsOptional()
  hasThread?: boolean;
}

export class SearchPaginationDto {
  @IsNumber()
  total: number;

  @IsNumber()
  limit: number;

  @IsNumber()
  offset: number;
}

export class SearchResponseDto {
  @IsArray()
  @Type(() => SearchResultItemDto)
  results: SearchResultItemDto[];

  @IsObject()
  @Type(() => SearchPaginationDto)
  pagination: SearchPaginationDto;
}