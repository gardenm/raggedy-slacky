import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Channel } from '../../entities/channel.entity';
import { SlackUser } from '../../entities/slack-user.entity';
import { Message } from '../../entities/message.entity';
import { SlackParserService } from './slack-parser.service';
import { VectorService } from '../search/vector.service';

@Injectable()
export class IndexingService {
  private readonly logger = new Logger(IndexingService.name);

  constructor(
    @InjectRepository(Channel)
    private channelsRepository: Repository<Channel>,
    @InjectRepository(SlackUser)
    private slackUsersRepository: Repository<SlackUser>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private slackParserService: SlackParserService,
    private vectorService: VectorService,
    private dataSource: DataSource,
  ) {}

  async resetData(): Promise<void> {
    // Using a transaction to maintain data integrity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(Message, {});
      await queryRunner.manager.delete(Channel, {});
      await queryRunner.manager.delete(SlackUser, {});
      
      await queryRunner.commitTransaction();
      this.logger.log('Data reset complete');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to reset data: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async indexUsers(exportPath: string): Promise<number> {
    const slackUsers = await this.slackParserService.parseUsers(exportPath);
    
    let createdCount = 0;
    for (const user of slackUsers) {
      try {
        // Check if user already exists
        const existingUser = await this.slackUsersRepository.findOne({
          where: { slackUserId: user.id },
        });

        if (!existingUser) {
          const newUser = this.slackUsersRepository.create({
            slackUserId: user.id,
            username: user.name,
            realName: user.real_name,
            avatar: user.profile?.image_192 || user.profile?.image_72 || null,
          });

          await this.slackUsersRepository.save(newUser);
          createdCount++;
        }
      } catch (error) {
        this.logger.error(`Failed to index user ${user.id}: ${error.message}`);
      }
    }

    return createdCount;
  }

  async indexChannels(exportPath: string): Promise<number> {
    const slackChannels = await this.slackParserService.parseChannels(exportPath);
    
    let createdCount = 0;
    for (const channel of slackChannels) {
      try {
        // Check if channel already exists
        const existingChannel = await this.channelsRepository.findOne({
          where: { slackChannelId: channel.id },
        });

        if (!existingChannel) {
          const newChannel = this.channelsRepository.create({
            slackChannelId: channel.id,
            name: channel.name,
            purpose: channel.purpose?.value || null,
            isPrivate: channel.is_private,
          });

          await this.channelsRepository.save(newChannel);
          createdCount++;
        }
      } catch (error) {
        this.logger.error(`Failed to index channel ${channel.id}: ${error.message}`);
      }
    }

    return createdCount;
  }

  async indexMessages(exportPath: string): Promise<number> {
    // Get all channels
    const channels = await this.channelsRepository.find();
    
    let totalIndexed = 0;

    for (const channel of channels) {
      try {
        const slackMessages = await this.slackParserService.parseMessages(
          exportPath,
          channel.slackChannelId,
        );
        
        for (const message of slackMessages) {
          try {
            // Check if message already exists
            const messageId = this.slackParserService.generateMessageId(message.ts);
            const existingMessage = await this.messagesRepository.findOne({
              where: { slackMessageId: messageId },
            });

            if (!existingMessage) {
              // Get the user
              const user = await this.slackUsersRepository.findOne({
                where: { slackUserId: message.user },
              });

              if (!user) {
                this.logger.warn(`User ${message.user} not found for message ${message.ts}`);
                continue;
              }

              // Create the message
              const newMessage = this.messagesRepository.create({
                slackMessageId: messageId,
                slackUserId: user.id,
                channelId: channel.id,
                timestamp: new Date(parseFloat(message.ts) * 1000), // Convert to JavaScript timestamp
                threadTs: message.thread_ts || null,
                hasAttachments: message.files && message.files.length > 0,
                reactions: message.reactions || null,
              });

              await this.messagesRepository.save(newMessage);

              // Add the message to the vector database
              await this.vectorService.addDocument(
                messageId,
                message.text,
                {
                  messageId,
                  channelId: channel.id,
                  userId: user.id,
                  timestamp: message.ts,
                  threadTs: message.thread_ts || null,
                },
              );

              totalIndexed++;
            }
          } catch (error) {
            this.logger.error(`Failed to index message ${message.ts}: ${error.message}`);
            continue;
          }
        }
        
        this.logger.log(`Indexed ${totalIndexed} messages for channel ${channel.name}`);
      } catch (error) {
        this.logger.error(`Failed to index messages for channel ${channel.slackChannelId}: ${error.message}`);
        continue;
      }
    }

    return totalIndexed;
  }

  async indexAll(exportPath: string, resetData = false): Promise<{
    users: number;
    channels: number;
    messages: number;
  }> {
    if (resetData) {
      await this.resetData();
    }

    const usersCount = await this.indexUsers(exportPath);
    const channelsCount = await this.indexChannels(exportPath);
    const messagesCount = await this.indexMessages(exportPath);

    return {
      users: usersCount,
      channels: channelsCount,
      messages: messagesCount,
    };
  }
}