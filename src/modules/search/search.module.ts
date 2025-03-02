import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Message } from '../../entities/message.entity';
import { Channel } from '../../entities/channel.entity';
import { SlackUser } from '../../entities/slack-user.entity';
import { UserQuery } from '../../entities/user-query.entity';
import { VectorService } from './vector.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Channel, SlackUser, UserQuery]),
  ],
  providers: [SearchService, VectorService],
  controllers: [SearchController],
  exports: [SearchService, VectorService],
})
export class SearchModule {}