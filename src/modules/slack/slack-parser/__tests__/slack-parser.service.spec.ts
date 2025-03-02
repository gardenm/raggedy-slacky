import { Test, TestingModule } from '@nestjs/testing';
import { SlackParserService } from '../slack-parser.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { SlackExportMessage } from '../slack-parser.interface';

// Mock fs and path modules
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    readdir: jest.fn(),
  },
  existsSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

describe('SlackParserService', () => {
  let service: SlackParserService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: any) => {
      if (key === 'paths.slackExport') return './test-data/slack-export';
      return defaultValue;
    }),
  };

  // Sample test data
  const sampleUsers = [
    {
      id: 'U12345',
      name: 'johndoe',
      real_name: 'John Doe',
      profile: {
        image_72: 'https://example.com/avatar.jpg',
        display_name: 'johndoe',
      },
      is_bot: false,
    },
    {
      id: 'U67890',
      name: 'janedoe',
      real_name: 'Jane Doe',
      profile: {
        image_72: 'https://example.com/avatar2.jpg',
        display_name: 'janedoe',
      },
      is_bot: false,
    },
  ];

  const sampleChannels = [
    {
      id: 'C12345',
      name: 'general',
      created: 1600000000,
      creator: 'U12345',
      is_archived: false,
      is_general: true,
      topic: { value: 'General discussion' },
      purpose: { value: 'Company-wide announcements and work-based matters' },
      is_private: false,
    },
    {
      id: 'C67890',
      name: 'random',
      created: 1600000001,
      creator: 'U12345',
      is_archived: false,
      is_general: false,
      topic: { value: 'Random stuff' },
      purpose: { value: 'Non-work banter and water cooler conversation' },
      is_private: false,
    },
  ];

  const sampleMessages: SlackExportMessage[] = [
    {
      client_msg_id: 'abc123',
      type: 'message',
      user: 'U12345',
      text: 'Hello world!',
      ts: '1600000100.000000',
      team: 'T12345',
    },
    {
      client_msg_id: 'def456',
      type: 'message',
      user: 'U67890',
      text: 'Hello <@U12345>!',
      ts: '1600000200.000000',
      team: 'T12345',
    },
    {
      client_msg_id: 'ghi789',
      type: 'message',
      user: 'U12345',
      text: 'Check out <#C67890|random>',
      ts: '1600000300.000000',
      thread_ts: '1600000200.000000',
      parent_user_id: 'U67890',
      team: 'T12345',
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlackParserService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SlackParserService>(SlackParserService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseExport', () => {
    beforeEach(() => {
      // Mock the filesystem functions
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('users.json')) {
          return Promise.resolve(JSON.stringify(sampleUsers));
        } else if (filePath.includes('channels.json')) {
          return Promise.resolve(JSON.stringify(sampleChannels));
        } else if (filePath.includes('C12345')) {
          return Promise.resolve(JSON.stringify(sampleMessages.slice(0, 2)));
        } else if (filePath.includes('C67890')) {
          return Promise.resolve(JSON.stringify([sampleMessages[2]]));
        }
        return Promise.resolve('[]');
      });
      (fs.promises.readdir as jest.Mock).mockImplementation((dirPath: string) => {
        if (dirPath.includes('C12345')) {
          return Promise.resolve(['2020-09-13.json']);
        } else if (dirPath.includes('C67890')) {
          return Promise.resolve(['2020-09-14.json']);
        }
        return Promise.resolve([]);
      });
    });

    it('should parse export directory successfully', async () => {
      const result = await service.parseExport();

      expect(result).toBeDefined();
      expect(result.users).toEqual(sampleUsers);
      expect(result.channels).toEqual(sampleChannels);
      expect(result.channelMessages.size).toBe(2);
      expect(result.channelMessages.get('C12345')).toHaveLength(2);
      expect(result.channelMessages.get('C67890')).toHaveLength(1);
    });

    it('should throw error if export path does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(service.parseExport()).rejects.toThrow('Slack export path not found');
    });

    it('should filter private channels if requested', async () => {
      // Make one channel private
      const privateChannels = sampleChannels.map(c => 
        c.id === 'C67890' ? { ...c, is_private: true } : c
      );
      (fs.promises.readFile as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('channels.json')) {
          return Promise.resolve(JSON.stringify(privateChannels));
        }
        return Promise.resolve('[]');
      });

      const result = await service.parseExport({ includePrivateChannels: false });

      expect(result.channels).toHaveLength(1);
      expect(result.channels[0].id).toBe('C12345');
    });

    it('should limit number of messages if maxMessages is set', async () => {
      // Mock file contents with many messages
      const manyMessages = Array(10).fill(sampleMessages[0]);
      
      (fs.promises.readFile as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('users.json')) {
          return Promise.resolve(JSON.stringify(sampleUsers));
        } else if (filePath.includes('channels.json')) {
          return Promise.resolve(JSON.stringify(sampleChannels));
        } else if (filePath.includes('C12345')) {
          return Promise.resolve(JSON.stringify(manyMessages));
        } else {
          return Promise.resolve('[]');
        }
      });

      const result = await service.parseExport({ maxMessagesPerChannel: 5 });

      expect(result.channelMessages.get('C12345')).toHaveLength(5);
    });

    it('should filter messages by date if ignoreOlderThan is set', async () => {
      const date = new Date(1600000250 * 1000); // Between message 2 and 3
      const result = await service.parseExport({ ignoreOlderThan: date });

      // Only the third message is newer than the cutoff date
      expect(result.channelMessages.get('C12345')).toEqual([]);
      expect(result.channelMessages.get('C67890')).toHaveLength(1);
    });
  });

  describe('parseMessageContent', () => {
    it('should parse regular text message', () => {
      const message: SlackExportMessage = {
        type: 'message',
        text: 'Hello world!',
        ts: '1600000100.000000',
      };

      const result = service.parseMessageContent(message);

      expect(result.rawContent).toBe('Hello world!');
      expect(result.plainContent).toBe('Hello world!');
      expect(result.processedContent).toBe('hello world');
      expect(result.mentionedUsers).toBeUndefined();
      expect(result.mentionedChannels).toBeUndefined();
    });

    it('should parse message with user mentions', () => {
      const message: SlackExportMessage = {
        type: 'message',
        text: 'Hello <@U12345>!',
        ts: '1600000100.000000',
      };

      const result = service.parseMessageContent(message);

      expect(result.mentionedUsers).toContain('U12345');
    });

    it('should parse message with channel mentions', () => {
      const message: SlackExportMessage = {
        type: 'message',
        text: 'Check out <#C12345|general>',
        ts: '1600000100.000000',
      };

      const result = service.parseMessageContent(message);

      expect(result.mentionedChannels).toContain('C12345');
    });
  });

  describe('generateContentHash', () => {
    it('should generate consistent hash for same content', () => {
      const message1: SlackExportMessage = {
        type: 'message',
        text: 'Hello world!',
        ts: '1600000100.000000',
      };
      
      const message2: SlackExportMessage = {
        type: 'message',
        text: 'Hello world!',
        ts: '1600000200.000000', // Different timestamp
      };

      const hash1 = service.generateContentHash(message1);
      const hash2 = service.generateContentHash(message2);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different content', () => {
      const message1: SlackExportMessage = {
        type: 'message',
        text: 'Hello world!',
        ts: '1600000100.000000',
      };
      
      const message2: SlackExportMessage = {
        type: 'message',
        text: 'Hello there!',
        ts: '1600000100.000000',
      };

      const hash1 = service.generateContentHash(message1);
      const hash2 = service.generateContentHash(message2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('timestampToDate', () => {
    it('should convert Slack timestamp to Date object', () => {
      const ts = '1600000100.000000';
      const date = service.timestampToDate(ts);

      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).toBe(1600000100000);
    });
  });

  describe('parseThreads', () => {
    it('should identify thread replies', () => {
      const messages: SlackExportMessage[] = [
        {
          type: 'message',
          text: 'Parent message',
          ts: '1600000100.000000',
        },
        {
          type: 'message',
          text: 'Reply 1',
          ts: '1600000200.000000',
          thread_ts: '1600000100.000000',
        },
        {
          type: 'message',
          text: 'Reply 2',
          ts: '1600000300.000000',
          thread_ts: '1600000100.000000',
        },
        {
          type: 'message',
          text: 'Another parent',
          ts: '1600000400.000000',
        },
      ];

      const threads = service.parseThreads(messages);

      expect(threads.size).toBe(1);
      expect(threads.get('1600000100.000000')).toHaveLength(2);
    });
  });

  describe('validateExport', () => {
    beforeEach(() => {
      // Mock the filesystem functions
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('users.json')) {
          return Promise.resolve(JSON.stringify(sampleUsers));
        } else if (filePath.includes('channels.json')) {
          return Promise.resolve(JSON.stringify(sampleChannels));
        } else {
          return Promise.resolve(JSON.stringify(sampleMessages));
        }
      });
      (fs.promises.readdir as jest.Mock).mockImplementation((dirPath: string) => {
        return Promise.resolve(['2020-09-13.json']);
      });
    });

    it('should validate export directory successfully', async () => {
      const result = await service.validateExport('./test-data/slack-export');

      expect(result.errors).toHaveLength(0);
      expect(result.usersProcessed).toBe(2);
      expect(result.channelsProcessed).toBe(2);
      expect(result.messagesProcessed).toBe(6); // 3 messages * 2 channels
      expect(result.filesProcessed).toBe(0);
    });

    it('should report error if directory does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await service.validateExport('./nonexistent-dir');

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Export directory not found');
    });

    it('should report error if users.json is missing', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        return !path.includes('users.json');
      });

      const result = await service.validateExport('./test-data/slack-export');

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('users.json file not found');
    });

    it('should report error if channels.json is missing', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        return !path.includes('channels.json');
      });

      const result = await service.validateExport('./test-data/slack-export');

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('channels.json file not found');
    });

    it('should report error if channel directory is missing', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        return !path.includes('C12345') && !path.includes('C67890');
      });

      const result = await service.validateExport('./test-data/slack-export');

      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('Directory for channel #');
    });
  });
});