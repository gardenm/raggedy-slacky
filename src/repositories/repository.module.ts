import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from '../entities';
import { UserRepository } from './user.repository';
import { SlackUserRepository } from './slack-user.repository';
import { ChannelRepository } from './channel.repository';
import { MessageRepository } from './message.repository';
import { MessageContentRepository } from './message-content.repository';
import { AttachmentRepository } from './attachment.repository';
import { UserQueryRepository } from './user-query.repository';
import { ConversationRepository } from './conversation.repository';
import { ConversationMessageRepository } from './conversation-message.repository';

/**
 * All repositories are defined and exported from this module
 */
@Module({
  imports: [
    TypeOrmModule.forFeature(Object.values(entities)),
  ],
  providers: [
    UserRepository,
    SlackUserRepository,
    ChannelRepository,
    MessageRepository,
    MessageContentRepository,
    AttachmentRepository,
    UserQueryRepository,
    ConversationRepository,
    ConversationMessageRepository,
  ],
  exports: [
    UserRepository,
    SlackUserRepository,
    ChannelRepository,
    MessageRepository,
    MessageContentRepository,
    AttachmentRepository,
    UserQueryRepository,
    ConversationRepository,
    ConversationMessageRepository,
  ],
})
export class RepositoryModule {}