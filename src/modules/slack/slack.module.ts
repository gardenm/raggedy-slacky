import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlackService } from './slack.service';
import { SlackController } from './slack.controller';
import { Message } from '../../entities/message.entity';
import { Channel } from '../../entities/channel.entity';
import { SlackUser } from '../../entities/slack-user.entity';
import { MessageContent } from '../../entities/message-content.entity';
import { Attachment } from '../../entities/attachment.entity';
import { IndexingService } from './indexing.service';
import { SearchModule } from '../search/search.module';
import { SlackParserModule } from './slack-parser/slack-parser.module';
import { SlackParserService } from './slack-parser.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message, 
      Channel, 
      SlackUser, 
      MessageContent, 
      Attachment
    ]),
    SearchModule,
    SlackParserModule,
  ],
  providers: [SlackService, IndexingService, SlackParserService],
  controllers: [SlackController],
  exports: [SlackService, IndexingService, SlackParserService],
})
export class SlackModule {}