import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VectorService } from './vector.service';

/**
 * Module for vector database integration with Chroma
 */
@Module({
  imports: [ConfigModule],
  providers: [VectorService],
  exports: [VectorService],
})
export class VectorModule {}