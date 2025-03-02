import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SlackParserService } from './slack-parser.service';

/**
 * Module for parsing Slack export data
 */
@Module({
  imports: [ConfigModule],
  providers: [SlackParserService],
  exports: [SlackParserService],
})
export class SlackParserModule {}