import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan, FindManyOptions } from 'typeorm';
import { Message } from '../entities/message.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class MessageRepository extends BaseRepository<Message> {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {
    super(messageRepository);
  }

  /**
   * Find a message by its Slack message ID
   * @param slackMessageId The Slack message ID
   * @returns The message or null if not found
   */
  async findBySlackMessageId(slackMessageId: string): Promise<Message | null> {
    return this.findOne({ where: { slackMessageId } });
  }

  /**
   * Find messages from a specific channel
   * @param channelId The channel ID
   * @param options Additional find options
   * @returns Array of messages
   */
  async findByChannelId(channelId: number, options?: Omit<FindManyOptions<Message>, 'where'>): Promise<Message[]> {
    return this.findAll({
      ...options,
      where: { channelId },
      order: { timestamp: 'DESC' },
    });
  }

  /**
   * Find messages from a specific user
   * @param slackUserId The Slack user ID
   * @param options Additional find options
   * @returns Array of messages
   */
  async findBySlackUserId(slackUserId: number, options?: Omit<FindManyOptions<Message>, 'where'>): Promise<Message[]> {
    return this.findAll({
      ...options,
      where: { slackUserId },
      order: { timestamp: 'DESC' },
    });
  }

  /**
   * Find messages within a date range
   * @param startDate Start date
   * @param endDate End date
   * @param options Additional find options
   * @returns Array of messages
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: Omit<FindManyOptions<Message>, 'where'>,
  ): Promise<Message[]> {
    return this.findAll({
      ...options,
      where: { timestamp: Between(startDate, endDate) },
      order: { timestamp: 'ASC' },
    });
  }

  /**
   * Find messages before a certain date
   * @param date The date
   * @param options Additional find options
   * @returns Array of messages
   */
  async findBeforeDate(date: Date, options?: Omit<FindManyOptions<Message>, 'where'>): Promise<Message[]> {
    return this.findAll({
      ...options,
      where: { timestamp: LessThan(date) },
      order: { timestamp: 'DESC' },
    });
  }

  /**
   * Find messages after a certain date
   * @param date The date
   * @param options Additional find options
   * @returns Array of messages
   */
  async findAfterDate(date: Date, options?: Omit<FindManyOptions<Message>, 'where'>): Promise<Message[]> {
    return this.findAll({
      ...options,
      where: { timestamp: MoreThan(date) },
      order: { timestamp: 'ASC' },
    });
  }

  /**
   * Find messages that are replies in a thread
   * @param threadTs The thread timestamp
   * @param options Additional find options
   * @returns Array of messages
   */
  async findByThreadTs(threadTs: string, options?: Omit<FindManyOptions<Message>, 'where'>): Promise<Message[]> {
    return this.findAll({
      ...options,
      where: { threadTs },
      order: { timestamp: 'ASC' },
    });
  }

  /**
   * Find a message with its content
   * @param id The message ID
   * @returns The message with content or null if not found
   */
  async findWithContent(id: number): Promise<Message | null> {
    return this.findOne({
      where: { id },
      relations: ['content'],
    });
  }

  /**
   * Find a message with its attachments
   * @param id The message ID
   * @returns The message with attachments or null if not found
   */
  async findWithAttachments(id: number): Promise<Message | null> {
    return this.findOne({
      where: { id },
      relations: ['attachments'],
    });
  }

  /**
   * Find messages with content and author
   * @param options Additional find options
   * @returns Array of messages with content and author
   */
  async findWithContentAndAuthor(options?: FindManyOptions<Message>): Promise<Message[]> {
    return this.findAll({
      ...options,
      relations: ['content', 'slackUser'],
    });
  }

  /**
   * Find or create a message
   * @param messageData Message data
   * @returns The existing or newly created message
   */
  async findOrCreate(messageData: Partial<Message>): Promise<Message> {
    const { slackMessageId } = messageData;
    
    if (!slackMessageId) {
      throw new Error('Slack Message ID is required');
    }
    
    const existingMessage = await this.findBySlackMessageId(slackMessageId);
    
    if (existingMessage) {
      // Update existing message with new data
      return this.update(existingMessage.id, messageData);
    }
    
    // Create new message
    return this.create(messageData);
  }

  /**
   * Find messages that have attachments
   * @param options Additional find options
   * @returns Array of messages with attachments
   */
  async findWithHasAttachments(options?: Omit<FindManyOptions<Message>, 'where'>): Promise<Message[]> {
    return this.findAll({
      ...options,
      where: { hasAttachments: true },
    });
  }
}