import { Injectable } from '@nestjs/common';
import { SlackParserService } from './slack-parser.service';
import { IndexingService } from './indexing.service';
import { ImportRequestDto } from './dto/import-request.dto';

@Injectable()
export class SlackService {
  constructor(
    private slackParserService: SlackParserService,
    private indexingService: IndexingService,
  ) {}

  async importData(importRequest: ImportRequestDto) {
    const { path, resetData } = importRequest;
    
    const result = await this.indexingService.indexAll(path, resetData);
    
    return {
      success: true,
      ...result,
    };
  }
}