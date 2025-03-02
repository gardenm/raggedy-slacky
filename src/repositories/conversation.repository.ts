import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class ConversationRepository extends BaseRepository<Conversation> {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
  ) {
    super(conversationRepository);
  }

  /**
   * Find conversations by user ID
   * @param userId The user ID
   * @param options Additional find options
   * @returns Array of conversations
   */
  async findByUserId(userId: number, options?: Omit<FindManyOptions<Conversation>, 'where'>): Promise<Conversation[]> {
    return this.findAll({
      ...options,
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  /**
   * Find active conversations by user ID
   * @param userId The user ID
   * @returns Array of active conversations
   */
  async findActiveByUserId(userId: number): Promise<Conversation[]> {
    return this.findAll({
      where: { userId, isActive: true },
      order: { updatedAt: 'DESC' },
    });
  }

  /**
   * Find a conversation with its messages
   * @param id The conversation ID
   * @returns The conversation with messages or null if not found
   */
  async findWithMessages(id: number): Promise<Conversation | null> {
    return this.findOne({
      where: { id },
      relations: ['messages'],
      order: { messages: { timestamp: 'ASC' } },
    });
  }

  /**
   * Create a new conversation for a user
   * @param userId The user ID
   * @param title The conversation title
   * @returns The created conversation
   */
  async createConversation(userId: number, title: string): Promise<Conversation> {
    return this.create({
      userId,
      title,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Update the title of a conversation
   * @param id The conversation ID
   * @param title The new title
   * @returns The updated conversation
   */
  async updateTitle(id: number, title: string): Promise<Conversation> {
    return this.update(id, { 
      title,
      updatedAt: new Date(),
    });
  }

  /**
   * Mark a conversation as inactive
   * @param id The conversation ID
   * @returns The updated conversation
   */
  async markAsInactive(id: number): Promise<Conversation> {
    return this.update(id, { 
      isActive: false,
      updatedAt: new Date(),
    });
  }

  /**
   * Update the last updated timestamp of a conversation
   * @param id The conversation ID
   * @returns The updated conversation
   */
  async updateTimestamp(id: number): Promise<Conversation> {
    return this.update(id, { updatedAt: new Date() });
  }

  /**
   * Count active conversations for a user
   * @param userId The user ID
   * @returns The count of active conversations
   */
  async countActiveConversations(userId: number): Promise<number> {
    return this.count({
      where: { userId, isActive: true },
    });
  }
}