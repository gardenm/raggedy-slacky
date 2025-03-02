import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

interface SlackUser {
  id: string;
  name: string;
  real_name?: string;
  profile?: {
    image_original?: string;
    image_512?: string;
    image_192?: string;
    image_72?: string;
    display_name?: string;
  };
}

interface SlackChannel {
  id: string;
  name: string;
  purpose?: {
    value?: string;
  };
  is_private: boolean;
}

interface SlackMessage {
  client_msg_id?: string;
  type: string;
  user?: string;
  ts: string;
  text: string;
  thread_ts?: string;
  reactions?: Array<{
    name: string;
    users: string[];
    count: number;
  }>;
  files?: Array<any>;
}

@Injectable()
export class SlackParserService {
  private readonly logger = new Logger(SlackParserService.name);

  async parseUsers(exportPath: string): Promise<SlackUser[]> {
    try {
      const usersFilePath = path.join(exportPath, 'users.json');
      const usersData = await fs.readFile(usersFilePath, 'utf8');
      return JSON.parse(usersData);
    } catch (error) {
      this.logger.error(`Failed to parse users: ${error.message}`);
      return [];
    }
  }

  async parseChannels(exportPath: string): Promise<SlackChannel[]> {
    try {
      const channelsFilePath = path.join(exportPath, 'channels.json');
      const channelsData = await fs.readFile(channelsFilePath, 'utf8');
      return JSON.parse(channelsData);
    } catch (error) {
      this.logger.error(`Failed to parse channels: ${error.message}`);
      return [];
    }
  }

  async parseMessages(
    exportPath: string,
    channelId: string,
  ): Promise<SlackMessage[]> {
    const channelDirPath = path.join(exportPath, channelId);
    
    try {
      const channelDirStat = await fs.stat(channelDirPath);
      if (!channelDirStat.isDirectory()) {
        return [];
      }
    } catch (error) {
      this.logger.error(`Failed to access channel directory: ${error.message}`);
      return [];
    }
    
    try {
      const files = await fs.readdir(channelDirPath);
      const messageFiles = files.filter(file => file.endsWith('.json'));
      
      const allMessages: SlackMessage[] = [];
      
      for (const file of messageFiles) {
        try {
          const filePath = path.join(channelDirPath, file);
          const fileData = await fs.readFile(filePath, 'utf8');
          const messages = JSON.parse(fileData);
          
          // Filter valid messages (only regular messages, not channel joins, etc.)
          const validMessages = messages.filter(
            (msg: SlackMessage) => 
              msg.type === 'message' && 
              msg.user && 
              msg.ts
          );
          
          allMessages.push(...validMessages);
        } catch (error) {
          this.logger.warn(`Failed to parse message file ${file}: ${error.message}`);
          continue;
        }
      }
      
      return allMessages;
    } catch (error) {
      this.logger.error(`Failed to parse messages: ${error.message}`);
      return [];
    }
  }

  // Helper to generate a unique message ID from Slack's ts value
  generateMessageId(ts: string): string {
    // Replace the dot with something else to make it a valid ID
    return `msg_${ts.replace('.', '_')}`;
  }
}