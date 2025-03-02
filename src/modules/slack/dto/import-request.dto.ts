import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ImportRequestDto {
  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsBoolean()
  resetData?: boolean = false;
}