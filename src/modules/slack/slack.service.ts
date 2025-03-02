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
    const { path: importPath, resetData } = importRequest;
    
    // Use the provided path or fall back to the configured default path
    const resolvedPath = importPath || this.defaultExportPath;
    
    const result = await this.indexingService.indexAll(resolvedPath, resetData);
    
    return {
      success: true,
      path: resolvedPath,
      ...result,
    };
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