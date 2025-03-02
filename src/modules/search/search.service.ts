import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../../entities/message.entity';
import { Channel } from '../../entities/channel.entity';
import { SlackUser } from '../../entities/slack-user.entity';
import { UserQuery } from '../../entities/user-query.entity';
import { VectorService } from './vector.service';
import { SearchRequestDto } from './dto/search-request.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(Channel)
    private channelsRepository: Repository<Channel>,
    @InjectRepository(SlackUser)
    private slackUsersRepository: Repository<SlackUser>,
    @InjectRepository(UserQuery)
    private userQueriesRepository: Repository<UserQuery>,
    private vectorService: VectorService,
  ) {}

  async search(userId: number, searchRequest: SearchRequestDto) {
    const { query, limit, offset, channelIds, userIds, startDate, endDate } = searchRequest;

    // Search for messages in vector store
    const vectorResults = await this.vectorService.search(query, limit);

    // Get the message IDs from vector results
    const messageIds = vectorResults.map(result => result.metadata.messageId);

    // Fetch full message data from database
    let queryBuilder = this.messagesRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.channel', 'channel')
      .leftJoinAndSelect('message.slackUser', 'slackUser')
      .where('message.slackMessageId IN (:...messageIds)', { messageIds });

    // Apply filters
    if (channelIds && channelIds.length > 0) {
      queryBuilder = queryBuilder.andWhere('message.channelId IN (:...channelIds)', { channelIds });
    }

    if (userIds && userIds.length > 0) {
      queryBuilder = queryBuilder.andWhere('message.slackUserId IN (:...userIds)', { userIds });
    }

    if (startDate) {
      queryBuilder = queryBuilder.andWhere('message.timestamp >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder = queryBuilder.andWhere('message.timestamp <= :endDate', { endDate });
    }

    // Execute query
    const messages = await queryBuilder
      .skip(offset)
      .take(limit)
      .getMany();

    // Store the user query for history
    await this.storeUserQuery(userId, searchRequest, vectorResults.length);

    // Map messages to response format
    return {
      results: messages.map(message => ({
        id: message.id,
        content: vectorResults.find(r => r.metadata.messageId === message.slackMessageId)?.content || '',
        timestamp: message.timestamp,
        slackMessageId: message.slackMessageId,
        threadTs: message.threadTs,
        slackUser: {
          id: message.slackUser.id,
          username: message.slackUser.username,
          realName: message.slackUser.realName,
        },
        channel: {
          id: message.channel.id,
          name: message.channel.name,
        },
        score: vectorResults.find(r => r.metadata.messageId === message.slackMessageId)?.score || 0,
      })),
      pagination: {
        total: vectorResults.length,
        limit,
        offset,
      },
    };
  }

  private async storeUserQuery(
    userId: number, 
    searchRequest: SearchRequestDto, 
    resultCount: number
  ): Promise<void> {
    const userQuery = this.userQueriesRepository.create({
      userId,
      query: searchRequest.query,
      results: {
        count: resultCount,
        filters: {
          channelIds: searchRequest.channelIds,
          userIds: searchRequest.userIds,
          startDate: searchRequest.startDate,
          endDate: searchRequest.endDate,
        },
      },
    });

    await this.userQueriesRepository.save(userQuery);
  }

  async getChannels() {
    return this.channelsRepository.find({ order: { name: 'ASC' } });
  }

  async getSlackUsers() {
    return this.slackUsersRepository.find({ order: { username: 'ASC' } });
  }
}