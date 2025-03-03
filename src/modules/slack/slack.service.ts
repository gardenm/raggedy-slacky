import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SlackParserService } from './slack-parser.service';
import { IndexingService } from './indexing.service';
import { ImportRequestDto } from './dto/import-request.dto';
import * as path from 'path';

@Injectable()
export class SlackService {
  private readonly defaultExportPath: string;

  constructor(
    private slackParserService: SlackParserService,
    private indexingService: IndexingService,
    private configService: ConfigService,
  ) {
    this.defaultExportPath = this.configService.get<string>(
      'SLACK_EXPORT_PATH',
      './data/slack-archive',
    );
  }

  async importData(importRequest: ImportRequestDto) {
    const { path: importPath, resetData, batchOptions } = importRequest;
    
    // Use the provided path or fall back to the configured default path
    const resolvedPath = importPath || this.defaultExportPath;
    
    const startTime = Date.now();
    // Ensure batchOptions has the required properties
    const processedBatchOptions = batchOptions ? {
      batchSize: batchOptions.batchSize || 100,
      concurrency: batchOptions.concurrency || 5
    } : undefined;
    
    const result = await this.indexingService.indexAll(resolvedPath, resetData, processedBatchOptions);
    const duration = (Date.now() - startTime) / 1000;
    
    return {
      success: true,
      path: resolvedPath,
      ...result,
      duration,
    };
  }
  
  /**
   * Get statistics about the indexed data
   */
  async getStats() {
    return this.indexingService.getIndexStats();
  }

  /**
   * Get the absolute path to a channel directory in the Slack export
   */
  getChannelPath(channelId: string, basePath?: string): string {
    const exportPath = basePath || this.defaultExportPath;
    return path.join(exportPath, channelId);
  }

  /**
   * Get the absolute path to the users file in the Slack export
   */
  getUsersFilePath(basePath?: string): string {
    const exportPath = basePath || this.defaultExportPath;
    return path.join(exportPath, 'users.json');
  }

  /**
   * Get the absolute path to the channels file in the Slack export
   */
  getChannelsFilePath(basePath?: string): string {
    const exportPath = basePath || this.defaultExportPath;
    return path.join(exportPath, 'channels.json');
  }
}