import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Message } from '../../entities/message.entity';
import { MessageRepository } from '../message.repository';
import { createMockRepository, createSampleData } from './test-utils';
import { Between, LessThan, MoreThan } from 'typeorm';

describe('MessageRepository', () => {
  let repository: MessageRepository;
  let mockRepository: any;
  const sampleData = createSampleData();

  beforeEach(async () => {
    mockRepository = createMockRepository<Message>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageRepository,
        {
          provide: getRepositoryToken(Message),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<MessageRepository>(MessageRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findBySlackMessageId', () => {
    it('should find a message by slack message ID', async () => {
      const message = sampleData.messages[0];
      mockRepository.findOne.mockResolvedValue(message);

      const result = await repository.findBySlackMessageId('M12345');
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { slackMessageId: 'M12345' },
      });
      expect(result).toEqual(message);
    });

    it('should return null if message is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findBySlackMessageId('nonexistent');
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { slackMessageId: 'nonexistent' },
      });
      expect(result).toBeNull();
    });
  });

  describe('findByChannelId', () => {
    it('should find messages from a specific channel', async () => {
      const messages = [sampleData.messages[0], sampleData.messages[1]];
      mockRepository.find.mockResolvedValue(messages);

      const result = await repository.findByChannelId(1);
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { channelId: 1 },
        order: { timestamp: 'DESC' },
      });
      expect(result).toEqual(messages);
    });

    it('should apply additional options when provided', async () => {
      const messages = [sampleData.messages[0]];
      mockRepository.find.mockResolvedValue(messages);

      const result = await repository.findByChannelId(1, { take: 1 });
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { channelId: 1 },
        order: { timestamp: 'DESC' },
        take: 1,
      });
      expect(result).toEqual(messages);
    });
  });

  describe('findBySlackUserId', () => {
    it('should find messages from a specific user', async () => {
      const messages = [sampleData.messages[0], sampleData.messages[2]];
      mockRepository.find.mockResolvedValue(messages);

      const result = await repository.findBySlackUserId(1);
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { slackUserId: 1 },
        order: { timestamp: 'DESC' },
      });
      expect(result).toEqual(messages);
    });
  });

  describe('findByDateRange', () => {
    it('should find messages within a date range', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-02');
      const messages = [sampleData.messages[0], sampleData.messages[1]];
      mockRepository.find.mockResolvedValue(messages);

      const result = await repository.findByDateRange(startDate, endDate);
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { timestamp: Between(startDate, endDate) },
        order: { timestamp: 'ASC' },
      });
      expect(result).toEqual(messages);
    });
  });

  describe('findBeforeDate', () => {
    it('should find messages before a specific date', async () => {
      const date = new Date('2023-01-02');
      const messages = [sampleData.messages[0], sampleData.messages[1]];
      mockRepository.find.mockResolvedValue(messages);

      const result = await repository.findBeforeDate(date);
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { timestamp: LessThan(date) },
        order: { timestamp: 'DESC' },
      });
      expect(result).toEqual(messages);
    });
  });

  describe('findAfterDate', () => {
    it('should find messages after a specific date', async () => {
      const date = new Date('2023-01-01');
      const messages = [sampleData.messages[2]];
      mockRepository.find.mockResolvedValue(messages);

      const result = await repository.findAfterDate(date);
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { timestamp: MoreThan(date) },
        order: { timestamp: 'ASC' },
      });
      expect(result).toEqual(messages);
    });
  });

  describe('findByThreadTs', () => {
    it('should find messages in a thread', async () => {
      const messages = [sampleData.messages[1]];
      mockRepository.find.mockResolvedValue(messages);

      const result = await repository.findByThreadTs('M12345');
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { threadTs: 'M12345' },
        order: { timestamp: 'ASC' },
      });
      expect(result).toEqual(messages);
    });
  });

  describe('findWithContent', () => {
    it('should find a message with its content', async () => {
      const message = {
        ...sampleData.messages[0],
        content: sampleData.messageContents[0],
      };
      mockRepository.findOne.mockResolvedValue(message);

      const result = await repository.findWithContent(1);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['content'],
      });
      expect(result).toEqual(message);
    });
  });

  describe('findWithAttachments', () => {
    it('should find a message with its attachments', async () => {
      const message = {
        ...sampleData.messages[2],
        attachments: [sampleData.attachments[0]],
      };
      mockRepository.findOne.mockResolvedValue(message);

      const result = await repository.findWithAttachments(3);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 3 },
        relations: ['attachments'],
      });
      expect(result).toEqual(message);
    });
  });

  describe('findWithContentAndAuthor', () => {
    it('should find messages with content and author information', async () => {
      const messages = [
        {
          ...sampleData.messages[0],
          content: sampleData.messageContents[0],
          slackUser: sampleData.slackUsers[0],
        },
      ];
      mockRepository.find.mockResolvedValue(messages);

      const result = await repository.findWithContentAndAuthor();
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['content', 'slackUser'],
      });
      expect(result).toEqual(messages);
    });
  });

  describe('findOrCreate', () => {
    it('should return existing message if found', async () => {
      const message = sampleData.messages[0];
      mockRepository.findOne.mockResolvedValue(message);
      mockRepository.save.mockResolvedValue({ ...message, hasAttachments: true });

      const result = await repository.findOrCreate({
        slackMessageId: 'M12345',
        hasAttachments: true,
      });
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { slackMessageId: 'M12345' },
      });
      expect(result.hasAttachments).toBe(true);
    });

    it('should create a new message if not found', async () => {
      const newMessage = {
        slackMessageId: 'M99999',
        slackUserId: 1,
        channelId: 1,
        hasAttachments: false,
      };
      const createdMessage = { id: 4, ...newMessage, timestamp: new Date() };
      
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createdMessage);
      mockRepository.save.mockResolvedValue(createdMessage);

      const result = await repository.findOrCreate(newMessage);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { slackMessageId: 'M99999' },
      });
      expect(mockRepository.create).toHaveBeenCalledWith(newMessage);
      expect(result).toEqual(createdMessage);
    });

    it('should throw an error if slackMessageId is not provided', async () => {
      await expect(repository.findOrCreate({ channelId: 1 })).rejects.toThrow(
        'Slack Message ID is required',
      );
    });
  });

  describe('findWithHasAttachments', () => {
    it('should find messages that have attachments', async () => {
      const messages = [sampleData.messages[2]];
      mockRepository.find.mockResolvedValue(messages);

      const result = await repository.findWithHasAttachments();
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { hasAttachments: true },
      });
      expect(result).toEqual(messages);
    });
  });
});