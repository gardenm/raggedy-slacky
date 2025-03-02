import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SlackUser } from '../entities/slack-user.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class SlackUserRepository extends BaseRepository<SlackUser> {
  constructor(
    @InjectRepository(SlackUser)
    private readonly slackUserRepository: Repository<SlackUser>,
  ) {
    super(slackUserRepository);
  }

  /**
   * Find a Slack user by their Slack user ID
   * @param slackUserId The Slack user ID
   * @returns The Slack user or null if not found
   */
  async findBySlackUserId(slackUserId: string): Promise<SlackUser | null> {
    return this.findOne({ where: { slackUserId } });
  }

  /**
   * Find a Slack user by username
   * @param username The username to search for
   * @returns The Slack user or null if not found
   */
  async findByUsername(username: string): Promise<SlackUser | null> {
    return this.findOne({ where: { username } });
  }

  /**
   * Find bot users
   * @returns Array of bot users
   */
  async findBots(): Promise<SlackUser[]> {
    return this.findAll({ where: { isBot: true } });
  }

  /**
   * Find human users (non-bots)
   * @returns Array of human users
   */
  async findHumans(): Promise<SlackUser[]> {
    return this.findAll({ where: { isBot: false } });
  }

  /**
   * Find Slack user by ID with related messages
   * @param id The Slack user ID
   * @returns The Slack user with messages or null if not found
   */
  async findByIdWithMessages(id: number): Promise<SlackUser | null> {
    return this.findOne({
      where: { id },
      relations: ['messages'],
    });
  }

  /**
   * Find or create a Slack user
   * @param slackUserData Slack user data
   * @returns The existing or newly created Slack user
   */
  async findOrCreate(slackUserData: Partial<SlackUser>): Promise<SlackUser> {
    const { slackUserId } = slackUserData;
    
    if (!slackUserId) {
      throw new Error('Slack User ID is required');
    }
    
    const existingUser = await this.findBySlackUserId(slackUserId);
    
    if (existingUser) {
      // Update existing user with new data
      return this.update(existingUser.id, slackUserData);
    }
    
    // Create new user
    return this.create(slackUserData);
  }
}