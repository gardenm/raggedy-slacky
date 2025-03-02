import { IsBoolean, IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BatchOptionsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  batchSize?: number = 100;

  @IsOptional()
  @IsNumber()
  @Min(1)
  concurrency?: number = 5;
}

export class ImportRequestDto {
  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsBoolean()
  resetData?: boolean = false;

  @IsOptional()
  @ValidateNested()
  @Type(() => BatchOptionsDto)
  batchOptions?: BatchOptionsDto;
}