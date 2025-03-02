import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Message } from '../../entities/message.entity';
import { MessageContent } from '../../entities/message-content.entity';
import { Channel } from '../../entities/channel.entity';
import { SlackUser } from '../../entities/slack-user.entity';
import { UserQuery } from '../../entities/user-query.entity';
import { VectorService } from './vector.service';
import { SearchRequestDto } from './dto/search-request.dto';
import { SearchResponseDto, SearchResultItemDto } from './dto/search-response.dto';

interface SearchFilters {
  channelIds?: number[];
  userIds?: number[]; 
  startDate?: Date;
  endDate?: Date;
  threadTs?: string;
  hasAttachments?: boolean;
  includeTextSearch?: boolean;
}

interface SearchOptions {
  limit?: number;
  offset?: number;
  sortByDate?: boolean;
  sortDirection?: 'ASC' | 'DESC';
}

interface MessageWithContent extends Message {
  content?: MessageContent;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(MessageContent)
    private messageContentsRepository: Repository<MessageContent>,
    @InjectRepository(Channel)
    private channelsRepository: Repository<Channel>,
    @InjectRepository(SlackUser)
    private slackUsersRepository: Repository<SlackUser>,
    @InjectRepository(UserQuery)
    private userQueriesRepository: Repository<UserQuery>,
    private vectorService: VectorService,
  ) {}

  /**
   * Build vector database filters from search request
   */
  private buildVectorFilters(filters: SearchFilters): Record<string, any> {
    const vectorFilters: Record<string, any> = {};
    
    if (filters.channelIds && filters.channelIds.length > 0) {
      vectorFilters.channelId = { $in: filters.channelIds };
    }
    
    if (filters.userIds && filters.userIds.length > 0) {
      vectorFilters.userId = { $in: filters.userIds };
    }
    
    if (filters.threadTs) {
      vectorFilters.threadTs = filters.threadTs;
    }
    
    // Date filtering would need to be handled differently in Chroma
    // as it depends on how the dates are stored in metadata
    
    return vectorFilters;
  }
  
  /**
   * Perform a text-based search instead of vector search
   * This is useful for exact matches or when the vector database is not available
   */
  async textSearch(
    query: string,
    filters: SearchFilters,
    options: SearchOptions = {}
  ): Promise<SearchResultItemDto[]> {
    try {
      const { 
        limit = 20, 
        offset = 0,
        sortByDate = false,
        sortDirection = 'DESC'
      } = options;
      
      // Create full-text search query 
      // Note: This assumes PostgreSQL full-text search capabilities
      let queryBuilder = this.messageContentsRepository
        .createQueryBuilder('content')
        .leftJoinAndSelect('content.message', 'message')
        .leftJoinAndSelect('message.channel', 'channel')
        .leftJoinAndSelect('message.slackUser', 'slackUser')
        .where(`
          to_tsvector('english', content.plainContent) @@ 
          plainto_tsquery('english', :query)
        `, { query });
        
      // Apply filters
      if (filters.channelIds && filters.channelIds.length > 0) {
        queryBuilder = queryBuilder.andWhere('channel.id IN (:...channelIds)', { 
          channelIds: filters.channelIds 
        });
      }
      
      if (filters.userIds && filters.userIds.length > 0) {
        queryBuilder = queryBuilder.andWhere('slackUser.id IN (:...userIds)', { 
          userIds: filters.userIds 
        });
      }
      
      if (filters.threadTs) {
        queryBuilder = queryBuilder.andWhere('message.threadTs = :threadTs', { 
          threadTs: filters.threadTs 
        });
      }
      
      if (filters.startDate) {
        queryBuilder = queryBuilder.andWhere('message.timestamp >= :startDate', { 
          startDate: filters.startDate 
        });
      }
      
      if (filters.endDate) {
        queryBuilder = queryBuilder.andWhere('message.timestamp <= :endDate', { 
          endDate: filters.endDate 
        });
      }
      
      if (filters.hasAttachments !== undefined) {
        queryBuilder = queryBuilder.andWhere('message.hasAttachments = :hasAttachments', { 
          hasAttachments: filters.hasAttachments 
        });
      }
      
      // Apply sorting
      if (sortByDate) {
        queryBuilder = queryBuilder.orderBy('message.timestamp', sortDirection);
      } else {
        // Rank results by relevance using PostgreSQL ts_rank function
        queryBuilder = queryBuilder.orderBy(
          `ts_rank(to_tsvector('english', content.plainContent), plainto_tsquery('english', :query))`, 
          'DESC'
        );
      }
      
      // Apply pagination
      queryBuilder = queryBuilder
        .skip(offset)
        .take(limit);
        
      // Execute query
      const results = await queryBuilder.getMany();
      
      // Map results to DTO
      return results.map(content => {
        const message = content.message;
        return {
          id: message.id,
          content: content.plainContent,
          timestamp: message.timestamp,
          slackMessageId: message.slackMessageId,
          threadTs: message.threadTs,
          hasAttachments: message.hasAttachments,
          hasThread: !!message.threadTs,
          slackUser: {
            id: message.slackUser.id,
            username: message.slackUser.username,
            realName: message.slackUser.realName,
            avatar: message.slackUser.avatar,
          },
          channel: {
            id: message.channel.id,
            name: message.channel.name,
            isPrivate: message.channel.isPrivate,
          },
          score: 1.0, // Placeholder for text search
        };
      });
    } catch (error) {
      this.logger.error(`Error in text search: ${error.message}`);
      return [];
    }
  }

  /**
   * Get thread messages for context
   */
  private async getThreadMessages(threadTs: string): Promise<Message[]> {
    if (!threadTs) return [];
    
    return this.messagesRepository.find({
      where: { threadTs },
      relations: ['slackUser', 'channel', 'content'],
      order: { timestamp: 'ASC' },
    });
  }

  /**
   * Map message entities to search result DTOs
   */
  private mapMessageToSearchResult(
    message: Message, 
    vectorResults: any[]
  ): SearchResultItemDto {
    // Find matching vector result for this message
    const vectorResult = vectorResults.find(
      r => r.metadata.messageId === message.slackMessageId
    );
    
    return {
      id: message.id,
      content: vectorResult?.content || message.content?.plainContent || '',
      timestamp: message.timestamp,
      slackMessageId: message.slackMessageId,
      threadTs: message.threadTs,
      hasAttachments: message.hasAttachments,
      hasThread: !!message.threadTs,
      slackUser: {
        id: message.slackUser.id,
        username: message.slackUser.username,
        realName: message.slackUser.realName,
        avatar: message.slackUser.avatar,
      },
      channel: {
        id: message.channel.id,
        name: message.channel.name,
        isPrivate: message.channel.isPrivate,
      },
      score: vectorResult?.score || 0,
    };
  }

  /**
   * Perform search with semantic vector search and filters
   * Falls back to text search if no vector results or if requested
   */
  async search(userId: number, searchRequest: SearchRequestDto): Promise<SearchResponseDto> {
    const { 
      query, 
      limit = 20, 
      offset = 0, 
      channelIds, 
      userIds, 
      startDate, 
      endDate
    } = searchRequest;
    
    // Add option for text search through additional properties
    const includeTextSearch = searchRequest['includeTextSearch'] === true;
    const textSearchOnly = searchRequest['textSearchOnly'] === true;
    
    this.logger.log(`Searching for: "${query}" with ${JSON.stringify({
      channelIds, userIds, startDate, endDate, limit, offset,
      includeTextSearch, textSearchOnly
    })}`);

    try {
      let results: SearchResultItemDto[] = [];
      let totalResults = 0;
      
      // Skip vector search if text search only is requested
      if (!textSearchOnly) {
        // Build vector filters
        const vectorFilters = this.buildVectorFilters({
          channelIds,
          userIds,
        });

        // Search for messages in vector store with filters
        const vectorResults = await this.vectorService.search(
          query, 
          limit * 2, // Get more results to account for filtering
          vectorFilters
        );
        
        if (vectorResults && vectorResults.length > 0) {
          // Get the message IDs from vector results
          const messageIds = vectorResults.map(result => result.metadata.messageId);
          
          // Fetch full message data from database with all relations
          const messages = await this.messagesRepository.find({
            where: { slackMessageId: In(messageIds) },
            relations: ['slackUser', 'channel', 'content'],
          });
          
          // Apply additional database filters that weren't applied in vector search
          let filteredMessages = messages;
          
          // Apply date filters if provided
          if (startDate) {
            const startDateTime = new Date(startDate);
            filteredMessages = filteredMessages.filter(
              msg => msg.timestamp >= startDateTime
            );
          }
          
          if (endDate) {
            const endDateTime = new Date(endDate);
            filteredMessages = filteredMessages.filter(
              msg => msg.timestamp <= endDateTime
            );
          }
          
          // Sort by vector score (descending)
          filteredMessages.sort((a, b) => {
            const scoreA = vectorResults.find(r => r.metadata.messageId === a.slackMessageId)?.score || 0;
            const scoreB = vectorResults.find(r => r.metadata.messageId === b.slackMessageId)?.score || 0;
            return scoreB - scoreA;
          });
          
          totalResults = filteredMessages.length;
          
          // Apply pagination
          const paginatedMessages = filteredMessages.slice(offset, offset + limit);
          
          // Map messages to response format
          results = paginatedMessages.map(message => 
            this.mapMessageToSearchResult(message, vectorResults)
          );
        }
      }

      // Perform text search if requested or if vector search yielded no results
      if ((includeTextSearch || textSearchOnly) && results.length === 0) {
        this.logger.log(`Performing text search for: "${query}"`);
        
        const textResults = await this.textSearch(
          query,
          {
            channelIds,
            userIds,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
          },
          { limit, offset }
        );
        
        if (textResults.length > 0) {
          results = textResults;
          totalResults = textResults.length + limit; // Estimated total for pagination
          
          this.logger.log(`Found ${results.length} results from text search`);
        }
      }
      
      // Store the user query for history
      await this.storeUserQuery(userId, searchRequest, totalResults);
      
      // If no results found, return empty response
      if (results.length === 0) {
        this.logger.log(`No results found for query: "${query}"`);
        return {
          results: [],
          pagination: {
            total: 0,
            limit,
            offset,
          },
        };
      }
      
      return {
        results,
        pagination: {
          total: totalResults,
          limit,
          offset,
        },
      };
    } catch (error) {
      this.logger.error(`Error searching for: "${query}": ${error.message}`);
      
      // Try a fallback text search if vector search failed
      try {
        this.logger.log(`Attempting fallback text search for: "${query}"`);
        
        const textResults = await this.textSearch(
          query,
          {
            channelIds,
            userIds,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
          },
          { limit, offset }
        );
        
        // Store the user query for history
        await this.storeUserQuery(userId, searchRequest, textResults.length);
        
        return {
          results: textResults,
          pagination: {
            total: textResults.length + limit, // Estimated total for pagination
            limit,
            offset,
          },
        };
      } catch (fallbackError) {
        // If fallback fails too, rethrow original error
        throw error;
      }
    }
  }

  /**
   * Store user search query for analytics and history
   */
  private async storeUserQuery(
    userId: number, 
    searchRequest: SearchRequestDto, 
    resultCount: number
  ): Promise<UserQuery> {
    try {
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
          timestamp: new Date().toISOString(),
        },
        isConversational: false, // Regular search, not a conversational query
      });

      return await this.userQueriesRepository.save(userQuery);
    } catch (error) {
      this.logger.error(`Failed to store user query: ${error.message}`);
      // Don't throw error to avoid breaking the search flow
      return null;
    }
  }
  
  /**
   * Get thread context for a message
   * This returns the entire thread that a message belongs to
   */
  async getThreadContext(messageId: string): Promise<SearchResultItemDto[]> {
    try {
      // Find the message
      const message = await this.messagesRepository.findOne({
        where: { slackMessageId: messageId },
        relations: ['slackUser', 'channel', 'content'],
      });
      
      if (!message) {
        return [];
      }
      
      // If the message is not part of a thread, return just the message
      if (!message.threadTs) {
        return [this.mapMessageToSearchResult(message, [])];
      }
      
      // Find all messages in the thread
      const threadMessages = await this.messagesRepository.find({
        where: [
          { threadTs: message.threadTs },
          { slackMessageId: message.threadTs } // Include the parent message
        ],
        relations: ['slackUser', 'channel', 'content'],
        order: { timestamp: 'ASC' },
      });
      
      // Map to search result format
      return threadMessages.map(msg => this.mapMessageToSearchResult(msg, []));
    } catch (error) {
      this.logger.error(`Error fetching thread context: ${error.message}`);
      return [];
    }
  }

  /**
   * Get all channels for search filtering
   */
  async getChannels() {
    return this.channelsRepository.find({ 
      order: { name: 'ASC' },
      select: ['id', 'name', 'isPrivate', 'slackChannelId', 'purpose'] 
    });
  }

  /**
   * Get all Slack users for search filtering
   */
  async getSlackUsers() {
    return this.slackUsersRepository.find({ 
      order: { username: 'ASC' },
      select: ['id', 'username', 'realName', 'avatar', 'slackUserId'] 
    });
  }
  
  /**
   * Get user query history
   */
  async getUserQueryHistory(userId: number, limit = 20): Promise<UserQuery[]> {
    return this.userQueriesRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }
  
  /**
   * Get similar messages
   * This finds messages that are semantically similar to a given message
   */
  async getSimilarMessages(messageId: string, limit = 10): Promise<SearchResultItemDto[]> {
    try {
      // Find the message
      const message = await this.messagesRepository.findOne({
        where: { slackMessageId: messageId },
        relations: ['content'],
      });
      
      if (!message || !message.content) {
        return [];
      }
      
      // Use the message content to find similar messages
      const similarResults = await this.vectorService.search(
        message.content.processedContent,
        limit + 1 // +1 because the message itself will be in results
      );
      
      // Filter out the original message
      const filteredResults = similarResults.filter(
        result => result.metadata.messageId !== messageId
      ).slice(0, limit);
      
      // Get full message data for similar messages
      const messageIds = filteredResults.map(result => result.metadata.messageId);
      
      if (messageIds.length === 0) {
        return [];
      }
      
      const similarMessages = await this.messagesRepository.find({
        where: { slackMessageId: In(messageIds) },
        relations: ['slackUser', 'channel', 'content'],
      });
      
      // Map to search result format
      return similarMessages.map(msg => 
        this.mapMessageToSearchResult(msg, filteredResults)
      );
    } catch (error) {
      this.logger.error(`Error finding similar messages: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Search within a specific thread
   */
  async searchInThread(threadId: string, query: string): Promise<SearchResultItemDto[]> {
    try {
      // Get all messages in the thread
      const threadMessages = await this.messagesRepository.find({
        where: [
          { threadTs: threadId },
          { slackMessageId: threadId } // Include the parent message
        ],
        relations: ['slackUser', 'channel', 'content'],
      });
      
      if (!threadMessages || threadMessages.length === 0) {
        return [];
      }
      
      // Extract all message IDs from thread
      const messageIds = threadMessages.map(msg => msg.slackMessageId);
      
      // Build vector filters to search only within this thread
      const vectorFilters = {
        messageId: { $in: messageIds },
      };
      
      // Perform vector search with thread filter
      const searchResults = await this.vectorService.search(
        query,
        threadMessages.length,
        vectorFilters
      );
      
      if (!searchResults || searchResults.length === 0) {
        return [];
      }
      
      // Get relevant messages with full relations
      const resultIds = searchResults.map(result => result.metadata.messageId);
      const resultMessages = threadMessages.filter(
        msg => resultIds.includes(msg.slackMessageId)
      );
      
      // Map to search result format
      return resultMessages.map(msg => 
        this.mapMessageToSearchResult(msg, searchResults)
      );
    } catch (error) {
      this.logger.error(`Error searching in thread: ${error.message}`);
      return [];
    }
  }
}