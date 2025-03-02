import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Attachment } from '../entities/attachment.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class AttachmentRepository extends BaseRepository<Attachment> {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
  ) {
    super(attachmentRepository);
  }

  /**
   * Find attachments by message ID
   * @param messageId The message ID
   * @returns Array of attachments
   */
  async findByMessageId(messageId: number): Promise<Attachment[]> {
    return this.findAll({ where: { messageId } });
  }

  /**
   * Find attachment by Slack file ID
   * @param slackFileId The Slack file ID
   * @returns The attachment or null if not found
   */
  async findBySlackFileId(slackFileId: string): Promise<Attachment | null> {
    return this.findOne({ where: { slackFileId } });
  }

  /**
   * Find attachments by file type
   * @param filetype The file type
   * @param options Additional find options
   * @returns Array of attachments
   */
  async findByFiletype(filetype: string, options?: Omit<FindManyOptions<Attachment>, 'where'>): Promise<Attachment[]> {
    return this.findAll({
      ...options,
      where: { filetype },
    });
  }

  /**
   * Find attachments that have local files
   * @returns Array of attachments with local files
   */
  async findWithLocalFiles(): Promise<Attachment[]> {
    // Using raw query builder to handle IS NOT NULL condition
    return this.getRepository()
      .createQueryBuilder('attachment')
      .where('attachment.local_path IS NOT NULL')
      .getMany();
  }

  /**
   * Find attachments by message ID with message data
   * @param messageId The message ID
   * @returns Array of attachments with message data
   */
  async findByMessageIdWithMessage(messageId: number): Promise<Attachment[]> {
    return this.findAll({
      where: { messageId },
      relations: ['message'],
    });
  }

  /**
   * Search attachments by filename
   * @param filename Part of the filename to search for
   * @returns Array of attachments matching the filename
   */
  async searchByFilename(filename: string): Promise<Attachment[]> {
    // Using raw query builder for ILIKE operation
    return this.getRepository()
      .createQueryBuilder('attachment')
      .where('attachment.filename ILIKE :searchTerm', { searchTerm: `%${filename}%` })
      .getMany();
  }

  /**
   * Update local path for an attachment
   * @param id The attachment ID
   * @param localPath The local path
   * @returns The updated attachment
   */
  async updateLocalPath(id: number, localPath: string): Promise<Attachment> {
    return this.update(id, { localPath });
  }

  /**
   * Find or create an attachment
   * @param attachmentData Attachment data
   * @returns The existing or newly created attachment
   */
  async findOrCreate(attachmentData: Partial<Attachment>): Promise<Attachment> {
    const { slackFileId, messageId } = attachmentData;
    
    if (!slackFileId || !messageId) {
      throw new Error('Slack File ID and Message ID are required');
    }
    
    const existingAttachment = await this.findBySlackFileId(slackFileId);
    
    if (existingAttachment) {
      // Update existing attachment with new data
      return this.update(existingAttachment.id, attachmentData);
    }
    
    // Create new attachment
    return this.create(attachmentData);
  }
}