import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Channel } from '../../entities/channel.entity';
import { SlackUser } from '../../entities/slack-user.entity';
import { Message } from '../../entities/message.entity';
import { MessageContent } from '../../entities/message-content.entity';
import { Attachment } from '../../entities/attachment.entity';
import { SlackParserService } from './slack-parser.service';
import { VectorService } from '../search/vector.service';
import * as crypto from 'crypto';

interface BatchProcessingOptions {
  batchSize: number;
  concurrency: number;
}

@Injectable()
export class IndexingService {
  private readonly logger = new Logger(IndexingService.name);
  private readonly defaultBatchOptions: BatchProcessingOptions = {
    batchSize: 100,
    concurrency: 5,
  };

  constructor(
    @InjectRepository(Channel)
    private channelsRepository: Repository<Channel>,
    @InjectRepository(SlackUser)
    private slackUsersRepository: Repository<SlackUser>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(MessageContent)
    private messageContentsRepository: Repository<MessageContent>,
    @InjectRepository(Attachment)
    private attachmentsRepository: Repository<Attachment>,
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
      // Delete in order to respect foreign key constraints
      await queryRunner.manager.delete(Attachment, {});
      await queryRunner.manager.delete(MessageContent, {});
      await queryRunner.manager.delete(Message, {});
      await queryRunner.manager.delete(Channel, {});
      await queryRunner.manager.delete(SlackUser, {});
      
      // Also clear the vector store collections
      await this.vectorService.clearCollection();
      
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

  /**
   * Creates a content hash for deduplication and content tracking
   */
  private createContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Process text content for storage and embedding
   */
  private processTextContent(rawContent: string): {
    rawContent: string;
    plainContent: string;
    processedContent: string;
  } {
    // Remove extra whitespace and normalize line endings
    const normalizedContent = rawContent.replace(/\r\n/g, '\n').trim();
    
    // Create a plain text version (could strip Slack formatting, emojis, etc.)
    const plainContent = normalizedContent.replace(/<@[A-Z0-9]+>/g, '@user')
      .replace(/<#[A-Z0-9]+\|([^>]+)>/g, '#$1')
      .replace(/<(https?:[^>|]+)(\|[^>]+)?>/g, '$1');
    
    // Create an optimized version for embedding (could remove stop words, etc.)
    const processedContent = plainContent;
    
    return {
      rawContent: normalizedContent,
      plainContent,
      processedContent,
    };
  }

  /**
   * Split text into chunks for more effective vector indexing
   * This is particularly useful for long messages
   */
  private chunkText(text: string, maxChunkSize: number = 512): string[] {
    if (text.length <= maxChunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    let currentChunk = '';
    const sentences = text.split(/(?<=[.!?])\s+/);

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length <= maxChunkSize) {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        
        // If a single sentence is longer than maxChunkSize, split it by words
        if (sentence.length > maxChunkSize) {
          const words = sentence.split(/\s+/);
          currentChunk = '';
          
          for (const word of words) {
            if (currentChunk.length + word.length + 1 <= maxChunkSize) {
              currentChunk += (currentChunk ? ' ' : '') + word;
            } else {
              if (currentChunk) {
                chunks.push(currentChunk);
              }
              currentChunk = word;
            }
          }
        } else {
          currentChunk = sentence;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Process and store message attachments
   */
  private async processAttachments(
    message: any, 
    messageEntity: Message,
  ): Promise<void> {
    if (!message.files || message.files.length === 0) {
      return;
    }

    const attachments = message.files.map(file => {
      return this.attachmentsRepository.create({
        messageId: messageEntity.id,
        slackFileId: file.id,
        filename: file.name,
        filetype: file.filetype,
        filesize: file.size || null,
        urlPrivate: file.url_private || null,
        metadata: {
          originalFile: file,
        },
      });
    });

    await this.attachmentsRepository.save(attachments);
  }

  /**
   * Process messages in batches for a specific channel
   */
  private async processChannelMessagesBatch(
    channel: Channel,
    messages: any[],
    options: BatchProcessingOptions = this.defaultBatchOptions,
  ): Promise<number> {
    let processedCount = 0;
    const messageBatches: any[][] = [];
    
    // Create batches of messages
    for (let i = 0; i < messages.length; i += options.batchSize) {
      messageBatches.push(messages.slice(i, i + options.batchSize));
    }

    for (const batch of messageBatches) {
      // For each batch, process messages concurrently in smaller chunks
      const chunkSize = Math.ceil(batch.length / options.concurrency);
      const chunks: any[][] = [];
      
      for (let i = 0; i < batch.length; i += chunkSize) {
        chunks.push(batch.slice(i, i + chunkSize));
      }

      // Process each chunk in parallel
      const results = await Promise.all(
        chunks.map(chunk => this.processMessageChunk(channel, chunk))
      );
      
      processedCount += results.reduce((sum, count) => sum + count, 0);
    }

    return processedCount;
  }

  /**
   * Process a chunk of messages
   */
  private async processMessageChunk(channel: Channel, messages: any[]): Promise<number> {
    let processedCount = 0;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const message of messages) {
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

            // Process the text content
            const contentHash = this.createContentHash(message.text);
            
            // Create the message entity
            const newMessage = this.messagesRepository.create({
              slackMessageId: messageId,
              slackUserId: user.id,
              channelId: channel.id,
              timestamp: new Date(parseFloat(message.ts) * 1000),
              threadTs: message.thread_ts || null,
              hasAttachments: message.files && message.files.length > 0,
              reactions: message.reactions || null,
              contentHash,
              metadata: {
                edited: message.edited || null,
                parentUserId: message.parent_user_id || null,
              },
            });

            const savedMessage = await queryRunner.manager.save(Message, newMessage);

            // Process and save the message content
            const processedContent = this.processTextContent(message.text);
            const messageContent = this.messageContentsRepository.create({
              messageId: savedMessage.id,
              rawContent: processedContent.rawContent,
              plainContent: processedContent.plainContent,
              processedContent: processedContent.processedContent,
            });

            await queryRunner.manager.save(MessageContent, messageContent);

            // Process attachments if present
            if (message.files && message.files.length > 0) {
              const attachments = message.files.map(file => {
                return this.attachmentsRepository.create({
                  messageId: savedMessage.id,
                  slackFileId: file.id,
                  filename: file.name,
                  filetype: file.filetype,
                  filesize: file.size || null,
                  urlPrivate: file.url_private || null,
                  metadata: {
                    originalFile: file,
                  },
                });
              });

              await queryRunner.manager.save(Attachment, attachments);
            }

            // Create metadata for vector storage
            const vectorMetadata = {
              messageId,
              channelId: channel.id,
              userId: user.id,
              timestamp: message.ts,
              threadTs: message.thread_ts || null,
            };
            
            // Add to vector database - use the processed content for better embedding
            await this.vectorService.addDocument(
              messageId,
              processedContent.processedContent,
              vectorMetadata
            );
            
            // For long messages, split into chunks for better retrieval
            if (processedContent.processedContent.length > 1000) {
              await this.processLongMessage(
                messageId, 
                processedContent.processedContent, 
                vectorMetadata
              );
            }

            processedCount++;
          }
        } catch (error) {
          this.logger.error(`Failed to process message ${message.ts}: ${error.message}`);
          // Continue with other messages in the transaction
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Transaction failed: ${error.message}`);
    } finally {
      await queryRunner.release();
    }

    return processedCount;
  }

  async indexMessages(
    exportPath: string, 
    batchOptions?: BatchProcessingOptions
  ): Promise<number> {
    // Get all channels
    const channels = await this.channelsRepository.find();
    
    let totalIndexed = 0;
    const options = batchOptions || this.defaultBatchOptions;

    for (const channel of channels) {
      try {
        const slackMessages = await this.slackParserService.parseMessages(
          exportPath,
          channel.slackChannelId,
        );
        
        this.logger.log(`Processing ${slackMessages.length} messages for channel ${channel.name}`);
        
        // Process messages in batches
        const processedCount = await this.processChannelMessagesBatch(
          channel, 
          slackMessages,
          options
        );
        
        totalIndexed += processedCount;
        this.logger.log(`Indexed ${processedCount} messages for channel ${channel.name}`);
      } catch (error) {
        this.logger.error(`Failed to index messages for channel ${channel.slackChannelId}: ${error.message}`);
        continue;
      }
    }

    return totalIndexed;
  }

  /**
   * Process a long message by chunking it and creating multiple vector entries
   * This is useful for long messages that would benefit from multiple embeddings
   */
  async processLongMessage(messageId: string, content: string, metadata: any): Promise<void> {
    if (!content || content.length < 1000) {
      return; // Only process long messages
    }

    const chunks = this.chunkText(content);
    
    // Skip the first chunk as it's already indexed with the main message
    if (chunks.length > 1) {
      for (let i = 1; i < chunks.length; i++) {
        const chunkId = `${messageId}_chunk_${i}`;
        await this.vectorService.addDocument(
          chunkId,
          chunks[i],
          {
            ...metadata,
            isChunk: true,
            chunkIndex: i,
            parentMessageId: messageId,
          }
        );
      }
    }
  }

  /**
   * Get statistics about the indexed data
   */
  async getIndexStats(): Promise<{
    users: number;
    channels: number;
    messages: number;
    messageContents: number;
    attachments: number;
  }> {
    const users = await this.slackUsersRepository.count();
    const channels = await this.channelsRepository.count();
    const messages = await this.messagesRepository.count();
    const messageContents = await this.messageContentsRepository.count();
    const attachments = await this.attachmentsRepository.count();

    return {
      users,
      channels,
      messages,
      messageContents,
      attachments,
    };
  }

  /**
   * Monitor and report progress during indexing
   */
  private reportProgress(
    entity: string, 
    current: number, 
    total: number | null, 
    startTime: number
  ): void {
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    const itemsPerSecond = current / elapsedSeconds;
    
    if (total) {
      const percentComplete = (current / total) * 100;
      this.logger.log(
        `Indexing ${entity}: ${current}/${total} (${percentComplete.toFixed(2)}%) - ${itemsPerSecond.toFixed(2)} items/sec`
      );
    } else {
      this.logger.log(
        `Indexing ${entity}: ${current} items - ${itemsPerSecond.toFixed(2)} items/sec`
      );
    }
  }

  /**
   * Index all Slack export data with progress tracking and performance optimization
   */
  async indexAll(
    exportPath: string, 
    resetData = false, 
    batchOptions?: BatchProcessingOptions
  ): Promise<{
    users: number;
    channels: number;
    messages: number;
    duration: number;
  }> {
    const startTime = Date.now();
    
    if (resetData) {
      this.logger.log('Resetting existing data...');
      await this.resetData();
    }

    this.logger.log('Starting indexing process...');
    
    // Index users and channels first
    const usersCount = await this.indexUsers(exportPath);
    this.logger.log(`Indexed ${usersCount} users`);
    
    const channelsCount = await this.indexChannels(exportPath);
    this.logger.log(`Indexed ${channelsCount} channels`);
    
    // Messages are the most time-consuming part
    this.logger.log('Starting message indexing (this may take a while)...');
    const messagesCount = await this.indexMessages(exportPath, batchOptions);
    
    const duration = (Date.now() - startTime) / 1000;
    this.logger.log(`Indexing completed in ${duration.toFixed(2)} seconds`);
    
    // Provide summary statistics
    this.logger.log(`Indexed ${usersCount} users, ${channelsCount} channels, and ${messagesCount} messages`);
    
    if (messagesCount > 0) {
      const messagesPerSecond = messagesCount / duration;
      this.logger.log(`Performance: ${messagesPerSecond.toFixed(2)} messages/second`);
    }

    return {
      users: usersCount,
      channels: channelsCount,
      messages: messagesCount,
      duration,
    };
  }
}