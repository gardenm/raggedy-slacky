import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlackService } from './slack.service';
import { SlackController } from './slack.controller';
import { Message } from '../../entities/message.entity';
import { Channel } from '../../entities/channel.entity';
import { SlackUser } from '../../entities/slack-user.entity';
import { SlackParserService } from './slack-parser.service';
import { IndexingService } from './indexing.service';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Channel, SlackUser]),
    SearchModule,
  ],
  providers: [SlackService, SlackParserService, IndexingService],
  controllers: [SlackController],
  exports: [SlackService, SlackParserService, IndexingService],
})
export class SlackModule {}