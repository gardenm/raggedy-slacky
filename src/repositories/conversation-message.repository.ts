import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { ConversationMessage } from '../entities/conversation-message.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class ConversationMessageRepository extends BaseRepository<ConversationMessage> {
  constructor(
    @InjectRepository(ConversationMessage)
    private readonly conversationMessageRepository: Repository<ConversationMessage>,
  ) {
    super(conversationMessageRepository);
  }

  /**
   * Find messages by conversation ID
   * @param conversationId The conversation ID
   * @param options Additional find options
   * @returns Array of conversation messages
   */
  async findByConversationId(
    conversationId: number,
    options?: Omit<FindManyOptions<ConversationMessage>, 'where'>,
  ): Promise<ConversationMessage[]> {
    return this.findAll({
      ...options,
      where: { conversationId },
      order: { timestamp: 'ASC' },
    });
  }

  /**
   * Find messages by role
   * @param conversationId The conversation ID
   * @param role The role (e.g., 'user', 'assistant')
   * @returns Array of conversation messages
   */
  async findByRole(conversationId: number, role: string): Promise<ConversationMessage[]> {
    return this.findAll({
      where: { conversationId, role },
      order: { timestamp: 'ASC' },
    });
  }

  /**
   * Find the last message in a conversation
   * @param conversationId The conversation ID
   * @returns The last message or null if none exists
   */
  async findLastMessage(conversationId: number): Promise<ConversationMessage | null> {
    const messages = await this.findAll({
      where: { conversationId },
      order: { timestamp: 'DESC' },
      take: 1,
    });
    
    return messages.length > 0 ? messages[0] : null;
  }

  /**
   * Find messages with references
   * @param conversationId The conversation ID
   * @returns Array of messages that reference Slack messages
   */
  async findWithReferences(conversationId: number): Promise<ConversationMessage[]> {
    return this.findAll({
      where: {
        conversationId,
        referencedMessages: (...args) => `${args[0]} IS NOT NULL AND jsonb_array_length(${args[0]}) > 0`,
      },
    });
  }

  /**
   * Add a new message to a conversation
   * @param conversationId The conversation ID
   * @param role The role of the message sender
   * @param content The message content
   * @param referencedMessages Optional array of Slack message IDs referenced
   * @param metadata Optional metadata
   * @returns The created message
   */
  async addMessage(
    conversationId: number,
    role: string,
    content: string,
    referencedMessages?: string[],
    metadata?: Record<string, any>,
  ): Promise<ConversationMessage> {
    return this.create({
      conversationId,
      role,
      content,
      timestamp: new Date(),
      referencedMessages,
      metadata,
    });
  }

  /**
   * Count messages in a conversation
   * @param conversationId The conversation ID
   * @returns The count of messages
   */
  async countMessages(conversationId: number): Promise<number> {
    return this.count({
      where: { conversationId },
    });
  }

  /**
   * Search message content
   * @param keyword The keyword to search for
   * @returns Array of messages matching the keyword
   */
  async searchContent(keyword: string): Promise<ConversationMessage[]> {
    return this.conversationMessageRepository
      .createQueryBuilder('cm')
      .where('cm.content ILIKE :keyword', { keyword: `%${keyword}%` })
      .orderBy('cm.timestamp', 'DESC')
      .getMany();
  }
}