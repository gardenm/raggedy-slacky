import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { MessageContent } from '../entities/message-content.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class MessageContentRepository extends BaseRepository<MessageContent> {
  constructor(
    @InjectRepository(MessageContent)
    private readonly messageContentRepository: Repository<MessageContent>,
  ) {
    super(messageContentRepository);
  }

  /**
   * Find message content by message ID
   * @param messageId The message ID
   * @returns The message content or null if not found
   */
  async findByMessageId(messageId: number): Promise<MessageContent | null> {
    return this.findOne({ where: { messageId } });
  }

  /**
   * Search message content by keyword
   * @param keyword The keyword to search for
   * @returns Array of message contents
   */
  async searchByKeyword(keyword: string): Promise<MessageContent[]> {
    return this.findAll({
      where: [
        { rawContent: ILike(`%${keyword}%`) },
        { plainContent: ILike(`%${keyword}%`) },
      ],
      relations: ['message'],
    });
  }

  /**
   * Find message content by message ID with message
   * @param messageId The message ID
   * @returns The message content with message or null if not found
   */
  async findByMessageIdWithMessage(messageId: number): Promise<MessageContent | null> {
    return this.findOne({
      where: { messageId },
      relations: ['message'],
    });
  }

  /**
   * Save plain content for a message
   * @param messageId The message ID
   * @param plainContent The plain content to save
   * @returns The updated message content
   */
  async savePlainContent(messageId: number, plainContent: string): Promise<MessageContent> {
    const content = await this.findByMessageId(messageId);
    
    if (!content) {
      throw new Error(`Message content not found for message ID: ${messageId}`);
    }
    
    return this.update(content.id, { plainContent });
  }

  /**
   * Save processed content for a message
   * @param messageId The message ID
   * @param processedContent The processed content to save
   * @returns The updated message content
   */
  async saveProcessedContent(messageId: number, processedContent: string): Promise<MessageContent> {
    const content = await this.findByMessageId(messageId);
    
    if (!content) {
      throw new Error(`Message content not found for message ID: ${messageId}`);
    }
    
    return this.update(content.id, { processedContent });
  }

  /**
   * Create or update message content
   * @param messageId The message ID
   * @param rawContent The raw content
   * @param plainContent Optional plain content
   * @param processedContent Optional processed content
   * @returns The created or updated message content
   */
  async createOrUpdate(
    messageId: number,
    rawContent: string,
    plainContent?: string,
    processedContent?: string,
  ): Promise<MessageContent> {
    const content = await this.findByMessageId(messageId);
    
    if (content) {
      return this.update(content.id, {
        rawContent,
        ...(plainContent && { plainContent }),
        ...(processedContent && { processedContent }),
      });
    }
    
    return this.create({
      messageId,
      rawContent,
      ...(plainContent && { plainContent }),
      ...(processedContent && { processedContent }),
    });
  }
}