import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../entities/channel.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class ChannelRepository extends BaseRepository<Channel> {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
  ) {
    super(channelRepository);
  }

  /**
   * Find a channel by its Slack channel ID
   * @param slackChannelId The Slack channel ID
   * @returns The channel or null if not found
   */
  async findBySlackChannelId(slackChannelId: string): Promise<Channel | null> {
    return this.findOne({ where: { slackChannelId } });
  }

  /**
   * Find a channel by name
   * @param name The channel name
   * @returns The channel or null if not found
   */
  async findByName(name: string): Promise<Channel | null> {
    return this.findOne({ where: { name } });
  }

  /**
   * Find all public channels
   * @returns Array of public channels
   */
  async findPublicChannels(): Promise<Channel[]> {
    return this.findAll({ where: { isPrivate: false } });
  }

  /**
   * Find all private channels
   * @returns Array of private channels
   */
  async findPrivateChannels(): Promise<Channel[]> {
    return this.findAll({ where: { isPrivate: true } });
  }

  /**
   * Find all active (non-archived) channels
   * @returns Array of active channels
   */
  async findActiveChannels(): Promise<Channel[]> {
    return this.findAll({ where: { isArchived: false } });
  }

  /**
   * Find all archived channels
   * @returns Array of archived channels
   */
  async findArchivedChannels(): Promise<Channel[]> {
    return this.findAll({ where: { isArchived: true } });
  }

  /**
   * Find a channel by ID with related messages
   * @param id The channel ID
   * @returns The channel with messages or null if not found
   */
  async findByIdWithMessages(id: number): Promise<Channel | null> {
    return this.findOne({
      where: { id },
      relations: ['messages'],
    });
  }

  /**
   * Find or create a channel
   * @param channelData Channel data
   * @returns The existing or newly created channel
   */
  async findOrCreate(channelData: Partial<Channel>): Promise<Channel> {
    const { slackChannelId } = channelData;
    
    if (!slackChannelId) {
      throw new Error('Slack Channel ID is required');
    }
    
    const existingChannel = await this.findBySlackChannelId(slackChannelId);
    
    if (existingChannel) {
      // Update existing channel with new data
      return this.update(existingChannel.id, channelData);
    }
    
    // Create new channel
    return this.create(channelData);
  }
}