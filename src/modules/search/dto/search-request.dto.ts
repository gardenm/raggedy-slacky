import { 
  IsOptional, 
  IsString, 
  IsNumber, 
  IsArray, 
  IsDateString, 
  IsBoolean,
  Min,
  Max 
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchRequestDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  channelIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  userIds?: number[];

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
  
  @IsOptional()
  @IsBoolean()
  includeTextSearch?: boolean = false;
  
  @IsOptional()
  @IsBoolean()
  textSearchOnly?: boolean = false;
  
  @IsOptional()
  @IsBoolean()
  sortByDate?: boolean = false;
  
  @IsOptional()
  @IsString()
  sortDirection?: 'ASC' | 'DESC' = 'DESC';
  
  @IsOptional()
  @IsBoolean()
  includeThreads?: boolean = false;
  
  @IsOptional()
  @IsBoolean()
  hasAttachments?: boolean;
}