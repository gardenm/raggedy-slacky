import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import {
  ParsedMessageContent,
  ParseResult,
  SlackExportChannel,
  SlackExportMessage,
  SlackExportStructure,
  SlackExportUser,
  SlackParserConfig,
} from './slack-parser.interface';
import { createHash } from 'crypto';

/**
 * Service for parsing Slack export data
 */
@Injectable()
export class SlackParserService {
  private readonly logger = new Logger(SlackParserService.name);
  private readonly defaultConfig: SlackParserConfig;

  constructor(private configService: ConfigService) {
    this.defaultConfig = {
      exportPath: this.configService.get<string>('paths.slackExport', './data/slack-archive'),
      maxMessagesPerChannel: undefined,
      ignoreOlderThan: undefined,
      includeDeleted: false,
      includePrivateChannels: true,
    };
  }

  /**
   * Parse a Slack export directory
   * @param config Optional configuration overrides
   * @returns Structure containing the parsed Slack export data
   */
  async parseExport(config?: Partial<SlackParserConfig>): Promise<SlackExportStructure> {
    const parsedConfig = { ...this.defaultConfig, ...config };
    const exportPath = parsedConfig.exportPath;
    
    this.logger.log(`Parsing Slack export at: ${exportPath}`);
    
    if (!fs.existsSync(exportPath)) {
      throw new Error(`Slack export path not found: ${exportPath}`);
    }
    
    try {
      // Load user data
      const users = await this.parseUsers(exportPath);
      this.logger.log(`Parsed ${users.length} users`);
      
      // Load channel data
      const channels = await this.parseChannels(exportPath, parsedConfig.includePrivateChannels);
      this.logger.log(`Parsed ${channels.length} channels`);
      
      // Load messages for each channel
      const channelMessages = new Map<string, SlackExportMessage[]>();
      
      for (const channel of channels) {
        try {
          const messages = await this.parseChannelMessages(
            exportPath, 
            channel.id,
            parsedConfig.maxMessagesPerChannel,
            parsedConfig.ignoreOlderThan
          );
          
          channelMessages.set(channel.id, messages);
          this.logger.debug(`Parsed ${messages.length} messages for channel #${channel.name}`);
        } catch (error) {
          this.logger.error(`Error parsing messages for channel #${channel.name}: ${error.message}`);
        }
      }
      
      const totalMessages = Array.from(channelMessages.values()).reduce((sum, msgs) => sum + msgs.length, 0);
      this.logger.log(`Parsed a total of ${totalMessages} messages across all channels`);
      
      return {
        users,
        channels,
        channelMessages,
      };
    } catch (error) {
      this.logger.error(`Error parsing Slack export: ${error.message}`, error.stack);
      throw new Error(`Failed to parse Slack export: ${error.message}`);
    }
  }

  /**
   * Parse the users.json file
   * @param exportPath Path to the export directory
   * @returns Array of parsed users
   */
  private async parseUsers(exportPath: string): Promise<SlackExportUser[]> {
    const usersPath = path.join(exportPath, 'users.json');
    
    if (!fs.existsSync(usersPath)) {
      this.logger.warn('users.json file not found in export');
      return [];
    }
    
    try {
      const usersData = await fs.promises.readFile(usersPath, 'utf8');
      const users: SlackExportUser[] = JSON.parse(usersData);
      return users;
    } catch (error) {
      this.logger.error(`Error parsing users.json: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse the channels.json file
   * @param exportPath Path to the export directory
   * @param includePrivateChannels Whether to include private channels
   * @returns Array of parsed channels
   */
  private async parseChannels(
    exportPath: string,
    includePrivateChannels: boolean = true
  ): Promise<SlackExportChannel[]> {
    const channelsPath = path.join(exportPath, 'channels.json');
    
    if (!fs.existsSync(channelsPath)) {
      this.logger.warn('channels.json file not found in export');
      return [];
    }
    
    try {
      const channelsData = await fs.promises.readFile(channelsPath, 'utf8');
      let channels: SlackExportChannel[] = JSON.parse(channelsData);
      
      // Filter out private channels if needed
      if (!includePrivateChannels) {
        channels = channels.filter(channel => !channel.is_private);
      }
      
      return channels;
    } catch (error) {
      this.logger.error(`Error parsing channels.json: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse all message files for a channel
   * @param exportPath Path to the export directory
   * @param channelId Channel ID
   * @param maxMessages Maximum number of messages to parse
   * @param ignoreOlderThan Ignore messages older than this date
   * @returns Array of parsed messages
   */
  private async parseChannelMessages(
    exportPath: string,
    channelId: string,
    maxMessages?: number,
    ignoreOlderThan?: Date
  ): Promise<SlackExportMessage[]> {
    const channelPath = path.join(exportPath, channelId);
    
    if (!fs.existsSync(channelPath)) {
      this.logger.warn(`Channel directory not found: ${channelPath}`);
      return [];
    }
    
    try {
      // Get all JSON files in the channel directory
      const files = await fs.promises.readdir(channelPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      // Sort files by date (they typically have YYYY-MM-DD.json format)
      jsonFiles.sort();
      
      // Parse each file and combine messages
      let allMessages: SlackExportMessage[] = [];
      
      for (const file of jsonFiles) {
        const filePath = path.join(channelPath, file);
        const fileData = await fs.promises.readFile(filePath, 'utf8');
        let messages: SlackExportMessage[] = JSON.parse(fileData);
        
        // Apply date filter if needed
        if (ignoreOlderThan) {
          const ignoreTimestamp = ignoreOlderThan.getTime() / 1000; // Convert to seconds
          messages = messages.filter(msg => {
            const msgTimestamp = parseFloat(msg.ts);
            return msgTimestamp >= ignoreTimestamp;
          });
        }
        
        allMessages = allMessages.concat(messages);
        
        // Apply message limit if needed
        if (maxMessages && allMessages.length >= maxMessages) {
          allMessages = allMessages.slice(0, maxMessages);
          break;
        }
      }
      
      // Sort all messages by timestamp
      allMessages.sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));
      
      return allMessages;
    } catch (error) {
      this.logger.error(`Error parsing messages for channel ${channelId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process message text to extract mentions, links, etc.
   * @param message The Slack message to process
   * @returns Processed message content
   */
  parseMessageContent(message: SlackExportMessage): ParsedMessageContent {
    const rawContent = message.text || '';
    
    // Parse mentioned users
    const mentionedUsers: string[] = [];
    const userMentionRegex = /<@([A-Z0-9]+)(?:\|[^>]+)?>/g;
    let userMatch;
    
    while ((userMatch = userMentionRegex.exec(rawContent)) !== null) {
      mentionedUsers.push(userMatch[1]);
    }
    
    // Parse mentioned channels
    const mentionedChannels: string[] = [];
    const channelMentionRegex = /<#([A-Z0-9]+)(?:\|[^>]+)?>/g;
    let channelMatch;
    
    while ((channelMatch = channelMentionRegex.exec(rawContent)) !== null) {
      mentionedChannels.push(channelMatch[1]);
    }
    
    // Generate plain content (replacing mentions with readable format)
    let plainContent = rawContent
      // Replace user mentions with @username format
      .replace(/<@([A-Z0-9]+)(?:\|([^>]+))?>/g, (_, userId, username) => {
        return `@${username || userId}`;
      })
      // Replace channel mentions with #channel format
      .replace(/<#([A-Z0-9]+)(?:\|([^>]+))?>/g, (_, channelId, channelName) => {
        return `#${channelName || channelId}`;
      })
      // Replace links
      .replace(/<(https?:[^|>]+)(?:\|([^>]+))?>/g, (_, url, text) => {
        return text || url;
      });
    
    // Generate processed content for search indexing
    // Remove special characters, lowercase, etc.
    const processedContent = plainContent
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace special chars with space
      .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
      .trim();
    
    return {
      rawContent,
      plainContent,
      processedContent,
      mentionedUsers: mentionedUsers.length > 0 ? mentionedUsers : undefined,
      mentionedChannels: mentionedChannels.length > 0 ? mentionedChannels : undefined,
    };
  }

  /**
   * Generate a content hash for message deduplication
   * @param message The Slack message
   * @returns Hash of the message content
   */
  generateContentHash(message: SlackExportMessage): string {
    const content = message.text || '';
    return createHash('md5').update(content).digest('hex');
  }

  /**
   * Convert Slack timestamp to Date object
   * @param ts Slack timestamp string (e.g. "1620000000.000000")
   * @returns JavaScript Date object
   */
  timestampToDate(ts: string): Date {
    const timestamp = parseFloat(ts) * 1000; // Convert to milliseconds
    return new Date(timestamp);
  }

  /**
   * Parse thread structure from messages
   * @param messages Array of messages
   * @returns Map of thread parent ts to child messages
   */
  parseThreads(messages: SlackExportMessage[]): Map<string, SlackExportMessage[]> {
    const threads = new Map<string, SlackExportMessage[]>();
    
    for (const message of messages) {
      if (message.thread_ts && message.thread_ts !== message.ts) {
        // This is a thread reply
        if (!threads.has(message.thread_ts)) {
          threads.set(message.thread_ts, []);
        }
        
        const threadMessages = threads.get(message.thread_ts);
        if (threadMessages) {
          threadMessages.push(message);
        }
      }
    }
    
    return threads;
  }

  /**
   * Validate the structure of a Slack export directory
   * @param exportPath Path to the export directory
   * @returns Validation result with any issues found
   */
  async validateExport(exportPath: string): Promise<ParseResult> {
    const result: ParseResult = {
      usersProcessed: 0,
      channelsProcessed: 0,
      messagesProcessed: 0,
      filesProcessed: 0,
      errors: [],
    };
    
    try {
      // Check if directory exists
      if (!fs.existsSync(exportPath)) {
        result.errors.push(`Export directory not found: ${exportPath}`);
        return result;
      }
      
      // Check for users.json
      const usersPath = path.join(exportPath, 'users.json');
      if (!fs.existsSync(usersPath)) {
        result.errors.push('users.json file not found');
      } else {
        try {
          const usersData = await fs.promises.readFile(usersPath, 'utf8');
          const users: SlackExportUser[] = JSON.parse(usersData);
          result.usersProcessed = users.length;
        } catch (error) {
          result.errors.push(`Error parsing users.json: ${error.message}`);
        }
      }
      
      // Check for channels.json
      const channelsPath = path.join(exportPath, 'channels.json');
      if (!fs.existsSync(channelsPath)) {
        result.errors.push('channels.json file not found');
      } else {
        try {
          const channelsData = await fs.promises.readFile(channelsPath, 'utf8');
          const channels: SlackExportChannel[] = JSON.parse(channelsData);
          result.channelsProcessed = channels.length;
          
          // Check for channel directories
          let messageCount = 0;
          let fileCount = 0;
          
          for (const channel of channels) {
            const channelPath = path.join(exportPath, channel.id);
            
            if (!fs.existsSync(channelPath)) {
              result.errors.push(`Directory for channel #${channel.name} (${channel.id}) not found`);
              continue;
            }
            
            // Check for JSON files in the channel directory
            const files = await fs.promises.readdir(channelPath);
            const jsonFiles = files.filter(file => file.endsWith('.json'));
            
            if (jsonFiles.length === 0) {
              result.errors.push(`No message files found for channel #${channel.name} (${channel.id})`);
              continue;
            }
            
            // Count messages and files
            for (const file of jsonFiles) {
              try {
                const filePath = path.join(channelPath, file);
                const fileData = await fs.promises.readFile(filePath, 'utf8');
                const messages: SlackExportMessage[] = JSON.parse(fileData);
                
                messageCount += messages.length;
                
                // Count files in messages
                messages.forEach(message => {
                  if (message.files && message.files.length > 0) {
                    fileCount += message.files.length;
                  }
                });
              } catch (error) {
                result.errors.push(`Error parsing ${file} for channel #${channel.name}: ${error.message}`);
              }
            }
          }
          
          result.messagesProcessed = messageCount;
          result.filesProcessed = fileCount;
        } catch (error) {
          result.errors.push(`Error parsing channels.json: ${error.message}`);
        }
      }
      
      return result;
    } catch (error) {
      result.errors.push(`Error validating export: ${error.message}`);
      return result;
    }
  }
}