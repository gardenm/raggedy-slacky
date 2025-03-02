import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MessageContent } from '../../entities/message-content.entity';
import { MessageContentRepository } from '../message-content.repository';
import { createMockRepository, createSampleData } from './test-utils';
import { ILike } from 'typeorm';

describe('MessageContentRepository', () => {
  let repository: MessageContentRepository;
  let mockRepository: any;
  const sampleData = createSampleData();

  beforeEach(async () => {
    mockRepository = createMockRepository<MessageContent>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageContentRepository,
        {
          provide: getRepositoryToken(MessageContent),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<MessageContentRepository>(MessageContentRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByMessageId', () => {
    it('should find message content by message ID', async () => {
      const messageContent = sampleData.messageContents[0];
      mockRepository.findOne.mockResolvedValue(messageContent);

      const result = await repository.findByMessageId(1);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { messageId: 1 },
      });
      expect(result).toEqual(messageContent);
    });

    it('should return null if message content is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByMessageId(999);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { messageId: 999 },
      });
      expect(result).toBeNull();
    });
  });

  describe('searchByKeyword', () => {
    it('should search for message content containing the keyword', async () => {
      const messageContents = [sampleData.messageContents[0], sampleData.messageContents[1]];
      mockRepository.find.mockResolvedValue(messageContents);

      const result = await repository.searchByKeyword('hello');
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: [
          { rawContent: ILike('%hello%') },
          { plainContent: ILike('%hello%') },
        ],
        relations: ['message'],
      });
      expect(result).toEqual(messageContents);
    });
  });

  describe('findByMessageIdWithMessage', () => {
    it('should find message content with related message', async () => {
      const messageContent = {
        ...sampleData.messageContents[0],
        message: sampleData.messages[0],
      };
      mockRepository.findOne.mockResolvedValue(messageContent);

      const result = await repository.findByMessageIdWithMessage(1);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { messageId: 1 },
        relations: ['message'],
      });
      expect(result).toEqual(messageContent);
    });
  });

  describe('savePlainContent', () => {
    it('should save plain content for a message', async () => {
      const messageContent = sampleData.messageContents[0];
      const updatedContent = { ...messageContent, plainContent: 'Updated plain content' };
      
      mockRepository.findOne.mockResolvedValue(messageContent);
      mockRepository.save.mockResolvedValue(updatedContent);

      const result = await repository.savePlainContent(1, 'Updated plain content');
      
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(result.plainContent).toEqual('Updated plain content');
    });

    it('should throw an error if message content is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(repository.savePlainContent(999, 'test')).rejects.toThrow(
        'Message content not found for message ID: 999',
      );
    });
  });

  describe('saveProcessedContent', () => {
    it('should save processed content for a message', async () => {
      const messageContent = sampleData.messageContents[0];
      const updatedContent = { ...messageContent, processedContent: 'Updated processed content' };
      
      mockRepository.findOne.mockResolvedValue(messageContent);
      mockRepository.save.mockResolvedValue(updatedContent);

      const result = await repository.saveProcessedContent(1, 'Updated processed content');
      
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(result.processedContent).toEqual('Updated processed content');
    });

    it('should throw an error if message content is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(repository.saveProcessedContent(999, 'test')).rejects.toThrow(
        'Message content not found for message ID: 999',
      );
    });
  });

  describe('createOrUpdate', () => {
    it('should update existing message content if found', async () => {
      const messageContent = sampleData.messageContents[0];
      const updatedContent = {
        ...messageContent,
        rawContent: 'Updated raw content',
        plainContent: 'Updated plain content',
      };
      
      mockRepository.findOne.mockResolvedValue(messageContent);
      mockRepository.save.mockResolvedValue(updatedContent);

      const result = await repository.createOrUpdate(
        1,
        'Updated raw content',
        'Updated plain content',
      );
      
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(result.rawContent).toEqual('Updated raw content');
      expect(result.plainContent).toEqual('Updated plain content');
    });

    it('should create new message content if not found', async () => {
      const newContent = {
        messageId: 999,
        rawContent: 'New raw content',
        plainContent: 'New plain content',
        processedContent: 'New processed content',
      };
      const createdContent = { id: 4, ...newContent };
      
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createdContent);
      mockRepository.save.mockResolvedValue(createdContent);

      const result = await repository.createOrUpdate(
        999,
        'New raw content',
        'New plain content',
        'New processed content',
      );
      
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalledWith({
        messageId: 999,
        rawContent: 'New raw content',
        plainContent: 'New plain content',
        processedContent: 'New processed content',
      });
      expect(result).toEqual(createdContent);
    });

    it('should handle optional parameters correctly', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({
        id: 4,
        messageId: 999,
        rawContent: 'New raw content',
      });
      mockRepository.save.mockResolvedValue({
        id: 4,
        messageId: 999,
        rawContent: 'New raw content',
      });

      const result = await repository.createOrUpdate(999, 'New raw content');
      
      expect(mockRepository.create).toHaveBeenCalledWith({
        messageId: 999,
        rawContent: 'New raw content',
      });
      expect(result.rawContent).toEqual('New raw content');
    });
  });
});