import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { RagController } from './rag.controller';
import { SearchModule } from '../search/search.module';
import { LlmService } from './llm.service';

@Module({
  imports: [SearchModule],
  providers: [RagService, LlmService],
  controllers: [RagController],
  exports: [RagService, LlmService],
})
export class RagModule {}